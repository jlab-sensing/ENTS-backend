"""Token bucket based request rate limiting."""

from __future__ import annotations

import logging
import math
import os
import threading
import time
from dataclasses import dataclass
from functools import wraps
from typing import Any, Callable
from urllib.parse import urlparse

import jwt
import redis
from flask import after_this_request, current_app, request

logger = logging.getLogger(__name__)

TOKEN_BUCKET_LUA = """
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local requested = tonumber(ARGV[3])

local redis_time = redis.call("TIME")
local now = tonumber(redis_time[1]) + (tonumber(redis_time[2]) / 1000000)

local values = redis.call("HMGET", key, "tokens", "last_refill")
local tokens = tonumber(values[1])
local last_refill = tonumber(values[2])

if tokens == nil then
  tokens = capacity
end
if last_refill == nil then
  last_refill = now
end

local delta = now - last_refill
local had_negative_delta = 0
if delta < 0 then
  delta = 0
  had_negative_delta = 1
end

tokens = math.min(capacity, tokens + (delta * refill_rate))

local allowed = 0
if tokens >= requested then
  allowed = 1
  tokens = tokens - requested
end

redis.call("HSET", key, "tokens", tokens, "last_refill", now)

local ttl = math.ceil((capacity / refill_rate) * 2)
if ttl < 60 then
  ttl = 60
end
redis.call("EXPIRE", key, ttl)

local retry_after = 0
if allowed == 0 then
  retry_after = math.ceil((requested - tokens) / refill_rate)
end

return {allowed, tokens, retry_after, had_negative_delta}
"""


@dataclass
class RateLimitDecision:
    allowed: bool
    remaining: int
    retry_after: int
    capacity: int
    rule_name: str


class MemoryTokenBucketBackend:
    """In-memory token bucket backend (useful for tests)."""

    _MIN_BUCKET_TTL_SECONDS = 60.0
    _CLEANUP_EVERY_N_OPERATIONS = 256
    _MAX_BUCKETS = 10_000

    def __init__(self) -> None:
        self._buckets: dict[str, tuple[float, float, float]] = {}
        self._lock = threading.Lock()
        self._ops_since_cleanup = 0

    @classmethod
    def _bucket_ttl_seconds(cls, capacity: int, refill_rate: float) -> float:
        return max(cls._MIN_BUCKET_TTL_SECONDS, (float(capacity) / refill_rate) * 2.0)

    def _cleanup_locked(self, now: float) -> None:
        expired_keys = [
            bucket_key
            for bucket_key, (_, _, expires_at) in self._buckets.items()
            if expires_at <= now
        ]
        for bucket_key in expired_keys:
            self._buckets.pop(bucket_key, None)

        overflow = len(self._buckets) - self._MAX_BUCKETS
        if overflow > 0:
            keys_by_expiry = sorted(self._buckets.items(), key=lambda item: item[1][2])
            for bucket_key, _ in keys_by_expiry[:overflow]:
                self._buckets.pop(bucket_key, None)

    def consume(
        self, key: str, capacity: int, refill_rate: float, tokens: int = 1
    ) -> tuple[bool, int, int]:
        now = time.time()
        with self._lock:
            self._ops_since_cleanup += 1
            if self._ops_since_cleanup >= self._CLEANUP_EVERY_N_OPERATIONS:
                self._cleanup_locked(now)
                self._ops_since_cleanup = 0

            ttl_seconds = self._bucket_ttl_seconds(capacity, refill_rate)
            stored_tokens, last_refill, expires_at = self._buckets.get(
                key, (float(capacity), float(now), now + ttl_seconds)
            )

            if expires_at <= now:
                stored_tokens, last_refill = float(capacity), float(now)

            elapsed = now - last_refill
            if elapsed < 0:
                logger.warning(
                    "Rate limiter memory backend detected negative refill delta "
                    "for key %s; clamping to 0.",
                    key,
                )
                elapsed = 0.0
            available = min(float(capacity), stored_tokens + (elapsed * refill_rate))

            if available >= tokens:
                remaining = available - tokens
                allowed = True
                retry_after = 0
            else:
                remaining = available
                allowed = False
                retry_after = max(1, math.ceil((tokens - available) / refill_rate))

            self._buckets[key] = (remaining, now, now + ttl_seconds)
            return allowed, max(0, math.floor(remaining)), retry_after


class RedisTokenBucketBackend:
    """Redis-backed token bucket backend."""

    def __init__(self, redis_uri: str) -> None:
        self._redis = redis.Redis.from_url(redis_uri)
        self._script = self._redis.register_script(TOKEN_BUCKET_LUA)

    def consume(
        self, key: str, capacity: int, refill_rate: float, tokens: int = 1
    ) -> tuple[bool, int, int]:
        result = self._script(
            keys=[key],
            args=[float(capacity), float(refill_rate), int(tokens)],
        )
        allowed = bool(int(result[0]))
        remaining = max(0, int(float(result[1])))
        retry_after = max(0, int(result[2]))
        had_negative_delta = int(result[3]) if len(result) > 3 else 0
        if had_negative_delta:
            logger.warning(
                "Rate limiter Redis backend detected negative refill delta "
                "for key %s; clamping to 0.",
                key,
            )
        return allowed, remaining, retry_after


class TokenBucketRateLimiter:
    """Central token bucket rate limiter."""

    def __init__(self) -> None:
        self.enabled = False
        self.rules: dict[str, dict[str, float]] = {}
        self._backend: MemoryTokenBucketBackend | RedisTokenBucketBackend | None = None
        self._warned_unknown_rules: set[str] = set()

    def reset(self) -> None:
        self.enabled = False
        self.rules = {}
        self._backend = None
        self._warned_unknown_rules = set()

    def init_app(self, app: Any) -> None:
        self.enabled = bool(app.config.get("RATE_LIMIT_ENABLED", False))
        self.rules = self._normalize_rules(app.config.get("RATE_LIMIT_RULES", {}))
        self._warned_unknown_rules = set()
        if "default" not in self.rules:
            self.rules["default"] = {"capacity": 300.0, "refill_rate": 5.0}

        storage_uri = app.config.get("RATE_LIMIT_STORAGE_URI", "memory://")
        self._backend = self._build_backend(storage_uri)
        app.extensions["token_bucket_rate_limiter"] = self

    def _build_backend(
        self, storage_uri: str
    ) -> MemoryTokenBucketBackend | RedisTokenBucketBackend:
        parsed = urlparse(storage_uri)
        if parsed.scheme in {"", "memory"}:
            return MemoryTokenBucketBackend()

        try:
            backend = RedisTokenBucketBackend(storage_uri)
            backend._redis.ping()
            return backend
        except Exception:
            logger.warning(
                "Rate limiter Redis backend unavailable, using in-memory backend.",
                exc_info=True,
            )
            return MemoryTokenBucketBackend()

    @staticmethod
    def _normalize_rules(raw_rules: dict[str, Any]) -> dict[str, dict[str, float]]:
        default_capacity = 300.0
        default_refill_rate = 5.0
        rules: dict[str, dict[str, float]] = {}
        if not isinstance(raw_rules, dict):
            logger.warning(
                "RATE_LIMIT_RULES should be a mapping; got %s. "
                "Ignoring misconfigured value.",
                type(raw_rules).__name__,
            )
            return rules

        for name, values in raw_rules.items():
            if not isinstance(values, dict):
                logger.warning(
                    "Rate limit rule '%s' should be a mapping; got %s. Using defaults.",
                    name,
                    type(values).__name__,
                )
                values = {}

            raw_capacity = values.get("capacity", default_capacity)
            raw_refill_rate = values.get("refill_rate", default_refill_rate)

            try:
                capacity = float(raw_capacity)
            except (TypeError, ValueError):
                logger.warning(
                    "Rate limit rule '%s' has invalid capacity %r. Using default %.1f.",
                    name,
                    raw_capacity,
                    default_capacity,
                )
                capacity = default_capacity
            if capacity < 1.0:
                logger.warning(
                    "Rate limit rule '%s' capacity %.4f is below minimum 1.0; "
                    "clamping.",
                    name,
                    capacity,
                )
                capacity = 1.0

            try:
                refill_rate = float(raw_refill_rate)
            except (TypeError, ValueError):
                logger.warning(
                    "Rate limit rule '%s' has invalid refill_rate %r. "
                    "Using default %.1f.",
                    name,
                    raw_refill_rate,
                    default_refill_rate,
                )
                refill_rate = default_refill_rate
            if refill_rate < 0.001:
                logger.warning(
                    "Rate limit rule '%s' refill_rate %.4f is below minimum "
                    "0.001; clamping.",
                    name,
                    refill_rate,
                )
                refill_rate = 0.001

            rules[name] = {"capacity": capacity, "refill_rate": refill_rate}
        return rules

    def consume(
        self, rule_name: str, identity: str, tokens: int = 1
    ) -> RateLimitDecision:
        if not self.enabled or self._backend is None:
            return RateLimitDecision(
                allowed=True,
                remaining=0,
                retry_after=0,
                capacity=0,
                rule_name=rule_name,
            )

        effective_rule_name = rule_name
        if effective_rule_name not in self.rules:
            effective_rule_name = "default"
            if rule_name not in self._warned_unknown_rules:
                logger.warning(
                    "Rate limiter rule '%s' is not configured; using 'default'.",
                    rule_name,
                )
                self._warned_unknown_rules.add(rule_name)

        rule = self.rules[effective_rule_name]
        capacity = int(rule["capacity"])
        refill_rate = float(rule["refill_rate"])
        bucket_key = f"rate_limit:{effective_rule_name}:{identity}"

        try:
            allowed, remaining, retry_after = self._backend.consume(
                bucket_key, capacity=capacity, refill_rate=refill_rate, tokens=tokens
            )
        except Exception:
            logger.exception("Rate limiter backend error; allowing request")
            return RateLimitDecision(
                allowed=True,
                remaining=capacity,
                retry_after=0,
                capacity=capacity,
                rule_name=effective_rule_name,
            )

        return RateLimitDecision(
            allowed=allowed,
            remaining=remaining,
            retry_after=retry_after,
            capacity=capacity,
            rule_name=effective_rule_name,
        )


rate_limiter = TokenBucketRateLimiter()


def _get_remote_address() -> str:
    return request.remote_addr or "unknown"


def _get_user_from_access_token() -> str | None:
    header = request.headers.get("Authorization", "")
    if not header.lower().startswith("bearer "):
        return None

    token = header.split(" ", maxsplit=1)[1].strip()
    secret = current_app.config.get("ACCESS_TOKEN_SECRET") or os.getenv(
        "ACCESS_TOKEN_SECRET"
    )
    if not secret:
        return None

    audience = current_app.config.get("ACCESS_TOKEN_AUDIENCE")
    issuer = current_app.config.get("ACCESS_TOKEN_ISSUER")
    decode_kwargs: dict[str, Any] = {
        "algorithms": ["HS256"],
        "options": {"verify_aud": bool(audience), "verify_iss": bool(issuer)},
    }
    if audience:
        decode_kwargs["audience"] = audience
    if issuer:
        decode_kwargs["issuer"] = issuer

    try:
        data = jwt.decode(token, secret, **decode_kwargs)
    except Exception:
        return None
    uid = data.get("uid")
    if uid:
        return str(uid)
    return None


def default_rate_limit_key() -> str:
    uid = _get_user_from_access_token()
    if uid:
        return f"user:{uid}"

    api_key = request.headers.get("X-API-Key")
    if api_key:
        return f"api:{api_key}"

    return f"ip:{_get_remote_address()}"


def _redact_identity_for_logs(identity: str) -> str:
    if identity.startswith("api:"):
        return "api:[redacted]"
    if len(identity) <= 64:
        return identity
    return f"{identity[:61]}..."


def rate_limit(
    rule_name: str = "default",
    tokens: int = 1,
    key_func: Callable[[], str] | None = None,
) -> Callable:
    """Decorator for endpoint method rate limiting."""

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            limiter = current_app.extensions.get(
                "token_bucket_rate_limiter", rate_limiter
            )
            if not limiter.enabled:
                return func(*args, **kwargs)
            identity = (key_func or default_rate_limit_key)()
            decision = limiter.consume(
                rule_name=rule_name, identity=identity, tokens=tokens
            )

            if not decision.allowed:
                logger.info(
                    "Rate limit exceeded method=%s path=%s rule=%s "
                    "identity=%s retry_after=%s",
                    request.method,
                    request.path,
                    decision.rule_name,
                    _redact_identity_for_logs(identity),
                    decision.retry_after,
                )
                headers = {
                    "Retry-After": str(decision.retry_after),
                    "X-RateLimit-Limit": str(decision.capacity),
                    "X-RateLimit-Remaining": str(decision.remaining),
                    "X-RateLimit-Rule": decision.rule_name,
                }
                return (
                    {
                        "message": "Too many requests",
                        "retry_after": decision.retry_after,
                        "rule": decision.rule_name,
                    },
                    429,
                    headers,
                )

            @after_this_request
            def add_rate_limit_headers(response: Any) -> Any:
                response.headers["X-RateLimit-Limit"] = str(decision.capacity)
                response.headers["X-RateLimit-Remaining"] = str(decision.remaining)
                response.headers["X-RateLimit-Rule"] = decision.rule_name
                return response

            return func(*args, **kwargs)

        return wrapper

    return decorator
