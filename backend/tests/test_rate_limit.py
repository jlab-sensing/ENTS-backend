import logging
import time
from unittest.mock import MagicMock, patch

import jwt
import pytest
from flask import Flask, request

from api.rate_limit import (
    TOKEN_BUCKET_LUA,
    MemoryTokenBucketBackend,
    RedisTokenBucketBackend,
    TokenBucketRateLimiter,
    _get_user_from_access_token,
    default_rate_limit_key,
    rate_limit,
    rate_limiter,
)


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    rate_limiter.reset()
    yield
    rate_limiter.reset()


def create_rate_limit_test_app() -> Flask:
    app = Flask(__name__)
    app.config.update(
        RATE_LIMIT_ENABLED=True,
        RATE_LIMIT_STORAGE_URI="memory://",
        RATE_LIMIT_RULES={
            "default": {"capacity": 50, "refill_rate": 50},
            "tiny": {"capacity": 2, "refill_rate": 0.01},
        },
    )
    rate_limiter.init_app(app)

    @app.get("/limited")
    @rate_limit("tiny")
    def limited():
        return {"ok": True}

    @app.get("/limited-by-header")
    @rate_limit("tiny", key_func=lambda: request.headers.get("X-Test-Key", "anon"))
    def limited_by_header():
        return {"ok": True}

    @app.get("/unknown-rule")
    @rate_limit("missing_rule")
    def unknown_rule():
        return {"ok": True}

    @app.get("/default-rule")
    @rate_limit("default")
    def default_rule():
        return {"ok": True}

    return app


def test_rate_limit_blocks_after_capacity():
    app = create_rate_limit_test_app()
    client = app.test_client()

    first = client.get("/limited")
    second = client.get("/limited")
    blocked = client.get("/limited")

    assert first.status_code == 200
    assert first.headers["X-RateLimit-Limit"] == "2"
    assert first.headers["X-RateLimit-Remaining"] == "1"
    assert second.status_code == 200
    assert second.headers["X-RateLimit-Remaining"] == "0"
    assert blocked.status_code == 429
    assert blocked.json["rule"] == "tiny"
    assert int(blocked.headers["Retry-After"]) >= 1


def test_rate_limit_uses_distinct_keys():
    app = create_rate_limit_test_app()
    client = app.test_client()

    for _ in range(2):
        assert (
            client.get(
                "/limited-by-header", headers={"X-Test-Key": "alpha"}
            ).status_code
            == 200
        )
    assert (
        client.get("/limited-by-header", headers={"X-Test-Key": "alpha"}).status_code
        == 429
    )

    assert (
        client.get("/limited-by-header", headers={"X-Test-Key": "beta"}).status_code
        == 200
    )


def test_x_forwarded_for_does_not_bypass_ip_rate_limit():
    app = create_rate_limit_test_app()
    client = app.test_client()

    assert (
        client.get("/limited", headers={"X-Forwarded-For": "1.1.1.1"}).status_code
        == 200
    )
    assert (
        client.get("/limited", headers={"X-Forwarded-For": "2.2.2.2"}).status_code
        == 200
    )
    blocked = client.get("/limited", headers={"X-Forwarded-For": "3.3.3.3"})

    assert blocked.status_code == 429


def test_missing_rule_falls_back_to_default_and_warns_once(caplog):
    app = create_rate_limit_test_app()
    client = app.test_client()

    with caplog.at_level(logging.WARNING):
        first = client.get("/unknown-rule")
        second = client.get("/unknown-rule")

    assert first.status_code == 200
    assert first.headers["X-RateLimit-Rule"] == "default"
    assert second.status_code == 200
    assert second.headers["X-RateLimit-Rule"] == "default"

    warning_messages = [
        record.message
        for record in caplog.records
        if "not configured; using 'default'" in record.message
    ]
    assert len(warning_messages) == 1


def test_blocked_requests_are_logged(caplog):
    app = create_rate_limit_test_app()
    client = app.test_client()

    with caplog.at_level(logging.INFO):
        client.get("/limited")
        client.get("/limited")
        blocked = client.get("/limited")

    assert blocked.status_code == 429
    assert any("Rate limit exceeded" in record.message for record in caplog.records)


def test_lua_script_uses_redis_time():
    assert 'redis.call("TIME")' in TOKEN_BUCKET_LUA


def test_disabled_limiter_allows_all():
    """When RATE_LIMIT_ENABLED is False, all requests should pass through."""
    app = Flask(__name__)
    app.config.update(
        RATE_LIMIT_ENABLED=False,
        RATE_LIMIT_STORAGE_URI="memory://",
        RATE_LIMIT_RULES={"tiny": {"capacity": 1, "refill_rate": 0.001}},
    )
    rate_limiter.init_app(app)

    @app.get("/should-pass")
    @rate_limit("tiny")
    def should_pass():
        return {"ok": True}

    client = app.test_client()
    for _ in range(10):
        assert client.get("/should-pass").status_code == 200


def test_tokens_refill_over_time():
    """After exhausting tokens, waiting should allow new requests."""
    app = Flask(__name__)
    app.config.update(
        RATE_LIMIT_ENABLED=True,
        RATE_LIMIT_STORAGE_URI="memory://",
        RATE_LIMIT_RULES={
            # 1 token capacity, refills at 100/s → refill in 10ms
            "fast_refill": {"capacity": 1, "refill_rate": 100},
        },
    )
    rate_limiter.init_app(app)

    @app.get("/refill")
    @rate_limit("fast_refill")
    def refill():
        return {"ok": True}

    client = app.test_client()

    assert client.get("/refill").status_code == 200
    assert client.get("/refill").status_code == 429

    # Wait for refill
    time.sleep(0.05)

    assert client.get("/refill").status_code == 200


def test_successful_response_includes_headers():
    """Non-429 responses should still include X-RateLimit-* headers."""
    app = create_rate_limit_test_app()
    client = app.test_client()

    resp = client.get("/default-rule")
    assert resp.status_code == 200
    assert "X-RateLimit-Limit" in resp.headers
    assert "X-RateLimit-Remaining" in resp.headers
    assert "X-RateLimit-Rule" in resp.headers
    assert resp.headers["X-RateLimit-Rule"] == "default"


def test_graceful_degradation_on_backend_error():
    """If the backend raises, the request should be allowed (fail open)."""
    app = create_rate_limit_test_app()
    client = app.test_client()

    with patch.object(
        rate_limiter._backend, "consume", side_effect=RuntimeError("boom")
    ):
        resp = client.get("/limited")

    assert resp.status_code == 200


def test_memory_backend_evicts_old_entries():
    """Memory backend should not grow unboundedly."""
    backend = MemoryTokenBucketBackend()
    max_buckets = MemoryTokenBucketBackend._MAX_BUCKETS
    cleanup_interval = MemoryTokenBucketBackend._CLEANUP_EVERY_N_OPERATIONS

    # Insert more than the max
    total_inserts = max_buckets + 500
    for i in range(total_inserts):
        backend.consume(f"key:{i}", capacity=10, refill_rate=1)

    # Trigger one more cleanup cycle by doing enough operations
    for i in range(cleanup_interval):
        backend.consume(f"cleanup:{i}", capacity=10, refill_rate=1)

    # After cleanup, the eviction should have brought count back down
    assert len(backend._buckets) <= max_buckets + cleanup_interval


def test_missing_rule_uses_same_bucket_as_default_rule():
    """Missing-rule fallback should use the same default bucket state."""
    app = Flask(__name__)
    app.config.update(
        RATE_LIMIT_ENABLED=True,
        RATE_LIMIT_STORAGE_URI="memory://",
        RATE_LIMIT_RULES={
            "default": {"capacity": 1, "refill_rate": 0.001},
        },
    )
    rate_limiter.init_app(app)

    @app.get("/default")
    @rate_limit("default")
    def default_route():
        return {"ok": True}

    @app.get("/missing")
    @rate_limit("missing_rule_name")
    def missing_route():
        return {"ok": True}

    client = app.test_client()
    assert client.get("/missing").status_code == 200
    blocked = client.get("/default")
    assert blocked.status_code == 429
    assert blocked.headers["X-RateLimit-Rule"] == "default"


def test_default_rate_limit_key_priority():
    app = Flask(__name__)

    with app.test_request_context(
        "/",
        headers={"X-API-Key": "api123"},
        environ_base={"REMOTE_ADDR": "10.0.0.1"},
    ):
        with patch("api.rate_limit._get_user_from_access_token", return_value="u1"):
            assert default_rate_limit_key() == "user:u1"

    with app.test_request_context(
        "/",
        headers={"X-API-Key": "api123"},
        environ_base={"REMOTE_ADDR": "10.0.0.1"},
    ):
        with patch("api.rate_limit._get_user_from_access_token", return_value=None):
            assert default_rate_limit_key() == "api:api123"

    with app.test_request_context("/", environ_base={"REMOTE_ADDR": "10.0.0.1"}):
        with patch("api.rate_limit._get_user_from_access_token", return_value=None):
            assert default_rate_limit_key() == "ip:10.0.0.1"


def test_get_user_from_access_token_validates_audience_and_issuer():
    app = Flask(__name__)
    app.config["ACCESS_TOKEN_SECRET"] = "test-secret"
    app.config["ACCESS_TOKEN_AUDIENCE"] = "api-aud"
    app.config["ACCESS_TOKEN_ISSUER"] = "api-issuer"

    valid_token = jwt.encode(
        {"uid": "abc", "aud": "api-aud", "iss": "api-issuer"},
        "test-secret",
        algorithm="HS256",
    )
    wrong_audience_token = jwt.encode(
        {"uid": "abc", "aud": "other-aud", "iss": "api-issuer"},
        "test-secret",
        algorithm="HS256",
    )

    with app.test_request_context(
        "/", headers={"Authorization": f"Bearer {valid_token}"}
    ):
        assert _get_user_from_access_token() == "abc"

    with app.test_request_context(
        "/", headers={"Authorization": f"Bearer {wrong_audience_token}"}
    ):
        assert _get_user_from_access_token() is None


def test_normalize_rules_logs_and_clamps(caplog):
    limiter = TokenBucketRateLimiter()
    with caplog.at_level(logging.WARNING):
        rules = limiter._normalize_rules(
            {
                "bad": {
                    "capacity": 0,
                    "refill_rate": -1,
                },
                "bad_type": "oops",
            }
        )

    assert rules["bad"]["capacity"] == 1.0
    assert rules["bad"]["refill_rate"] == 0.001
    assert rules["bad_type"]["capacity"] == 300.0
    assert rules["bad_type"]["refill_rate"] == 5.0
    assert any("clamping" in r.message for r in caplog.records)


def test_build_backend_falls_back_to_memory_when_redis_unavailable(caplog):
    limiter = TokenBucketRateLimiter()
    fake_backend = MagicMock()
    fake_backend._redis.ping.side_effect = RuntimeError("redis down")

    with caplog.at_level(logging.WARNING):
        with patch("api.rate_limit.RedisTokenBucketBackend", return_value=fake_backend):
            backend = limiter._build_backend("redis://localhost:6379/0")

    assert isinstance(backend, MemoryTokenBucketBackend)
    assert any("using in-memory backend" in r.message for r in caplog.records)


def test_redis_backend_consume_parses_result_and_logs_negative_delta(caplog):
    fake_script = MagicMock(return_value=[1, 3.8, 0, 1])
    fake_redis = MagicMock()
    fake_redis.register_script.return_value = fake_script

    with patch("api.rate_limit.redis.Redis.from_url", return_value=fake_redis):
        backend = RedisTokenBucketBackend("redis://localhost:6379/0")

    with caplog.at_level(logging.WARNING):
        allowed, remaining, retry_after = backend.consume(
            "rate_limit:key", capacity=10, refill_rate=1.0, tokens=1
        )

    assert allowed is True
    assert remaining == 3
    assert retry_after == 0
    assert any("negative refill delta" in r.message for r in caplog.records)


def test_rate_limit_log_redacts_api_key(caplog):
    app = Flask(__name__)
    app.config.update(
        RATE_LIMIT_ENABLED=True,
        RATE_LIMIT_STORAGE_URI="memory://",
        RATE_LIMIT_RULES={"default": {"capacity": 1, "refill_rate": 0.001}},
    )
    rate_limiter.init_app(app)

    @app.get("/api-key-limited")
    @rate_limit("default")
    def api_key_limited():
        return {"ok": True}

    client = app.test_client()
    client.get("/api-key-limited", headers={"X-API-Key": "super-secret"})

    with caplog.at_level(logging.INFO):
        blocked = client.get("/api-key-limited", headers={"X-API-Key": "super-secret"})

    assert blocked.status_code == 429
    messages = [r.message for r in caplog.records if "Rate limit exceeded" in r.message]
    assert messages
    assert any("api:[redacted]" in message for message in messages)
    assert all("super-secret" not in message for message in messages)


def test_memory_backend_expired_bucket_resets_to_capacity():
    backend = MemoryTokenBucketBackend()

    with patch.object(backend, "_bucket_ttl_seconds", return_value=1.0):
        with patch("api.rate_limit.time.time", side_effect=[0.0, 2.0]):
            first_allowed, _, _ = backend.consume(
                "k", capacity=1, refill_rate=0.001, tokens=1
            )
            second_allowed, _, _ = backend.consume(
                "k", capacity=1, refill_rate=0.001, tokens=1
            )

    assert first_allowed is True
    assert second_allowed is True


def test_memory_backend_retry_after_uses_ceil_behavior():
    backend = MemoryTokenBucketBackend()

    backend.consume("key", capacity=1, refill_rate=0.5, tokens=1)
    allowed, _, retry_after = backend.consume(
        "key", capacity=1, refill_rate=0.5, tokens=1
    )

    assert allowed is False
    assert retry_after >= 2


# ---------------------------------------------------------------------------
# Part 2: Redis Integration Tests
# These tests run against a REAL Redis server to verify the Lua script works.
# They use database 15 to avoid touching production data.
# Skipped automatically if Redis is not running.
# ---------------------------------------------------------------------------

REDIS_TEST_URI = "redis://localhost:6379/15"


def _redis_is_available() -> bool:
    """Check if Redis is reachable."""
    import redis as _redis

    try:
        client = _redis.Redis.from_url(REDIS_TEST_URI)
        client.ping()
        return True
    except Exception:
        return False


requires_redis = pytest.mark.skipif(
    not _redis_is_available(), reason="Redis not available at localhost:6379"
)


@pytest.fixture()
def flush_redis_db():
    """Flush Redis DB 15 before and after each Redis test."""
    import redis as _redis

    client = _redis.Redis.from_url(REDIS_TEST_URI)
    client.flushdb()
    yield client
    client.flushdb()


def create_redis_test_app() -> Flask:
    """Create a Flask app using the real Redis backend."""
    app = Flask(__name__)
    app.config.update(
        RATE_LIMIT_ENABLED=True,
        RATE_LIMIT_STORAGE_URI=REDIS_TEST_URI,
        RATE_LIMIT_RULES={
            "default": {"capacity": 50, "refill_rate": 50},
            "tiny": {"capacity": 2, "refill_rate": 0.01},
            "fast_refill": {"capacity": 1, "refill_rate": 100},
        },
    )
    rate_limiter.init_app(app)

    @app.get("/limited")
    @rate_limit("tiny")
    def limited():
        return {"ok": True}

    @app.get("/limited-by-header")
    @rate_limit("tiny", key_func=lambda: request.headers.get("X-Test-Key", "anon"))
    def limited_by_header():
        return {"ok": True}

    @app.get("/refill")
    @rate_limit("fast_refill")
    def refill():
        return {"ok": True}

    return app


@requires_redis
def test_redis_blocks_after_capacity(flush_redis_db):
    """Redis Lua script should block requests after tokens are exhausted."""
    app = create_redis_test_app()
    client = app.test_client()

    first = client.get("/limited")
    second = client.get("/limited")
    blocked = client.get("/limited")

    assert first.status_code == 200
    assert first.headers["X-RateLimit-Limit"] == "2"
    assert int(first.headers["X-RateLimit-Remaining"]) == 1
    assert second.status_code == 200
    assert int(second.headers["X-RateLimit-Remaining"]) == 0
    assert blocked.status_code == 429
    assert blocked.json["rule"] == "tiny"


@requires_redis
def test_redis_tokens_refill_over_time(flush_redis_db):
    """Redis Lua script should refill tokens using Redis server TIME."""
    app = create_redis_test_app()
    client = app.test_client()

    # Exhaust the single token
    assert client.get("/refill").status_code == 200
    assert client.get("/refill").status_code == 429

    # Wait for refill (capacity=1, refill_rate=100 → 10ms to refill)
    time.sleep(0.05)

    # Should be allowed again
    assert client.get("/refill").status_code == 200


@requires_redis
def test_redis_distinct_keys(flush_redis_db):
    """Different clients should have independent Redis buckets."""
    app = create_redis_test_app()
    client = app.test_client()

    # Exhaust alpha's bucket
    for _ in range(2):
        resp = client.get("/limited-by-header", headers={"X-Test-Key": "alpha"})
        assert resp.status_code == 200

    assert (
        client.get("/limited-by-header", headers={"X-Test-Key": "alpha"}).status_code
        == 429
    )

    # Beta should still have tokens
    assert (
        client.get("/limited-by-header", headers={"X-Test-Key": "beta"}).status_code
        == 200
    )


@requires_redis
def test_redis_retry_after_header(flush_redis_db):
    """Redis should return a valid Retry-After value when blocked."""
    app = create_redis_test_app()
    client = app.test_client()

    # Exhaust tokens
    client.get("/limited")
    client.get("/limited")
    blocked = client.get("/limited")

    assert blocked.status_code == 429
    retry_after = int(blocked.headers["Retry-After"])
    # With refill_rate=0.01, it should take ~100s to refill 1 token
    assert retry_after >= 1


@requires_redis
def test_redis_keys_are_created_in_correct_db(flush_redis_db):
    """Verify that rate limit keys actually exist in Redis DB 15."""
    app = create_redis_test_app()
    client = app.test_client()

    client.get("/limited")

    # Check that at least one rate_limit key was created in our test DB
    keys = flush_redis_db.keys("rate_limit:*")
    assert len(keys) >= 1
    assert any(b"rate_limit:tiny:" in key for key in keys)
