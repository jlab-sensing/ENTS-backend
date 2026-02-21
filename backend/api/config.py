"""Configuration module

Environment variables for flask application

"""

import os
from datetime import timedelta
import redis


class Config(object):
    SECRET_KEY = os.environ.get("SECRET_KEY") or "super-secret-key"
    CSRF_ENABLED = True
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}
    # SQLALCHEMY_ECHO = True
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
    ACCESS_TOKEN_SECRET = os.getenv("ACCESS_TOKEN_SECRET")
    ACCESS_TOKEN_AUDIENCE = os.getenv("ACCESS_TOKEN_AUDIENCE")
    ACCESS_TOKEN_ISSUER = os.getenv("ACCESS_TOKEN_ISSUER")
    REDIRECT_URI = os.getenv("OAUTH_REDIRECT_URI")
    SESSION_COOKIE_NAME = "google-login-session"
    PERMANENT_SESSION_LIFETIME = timedelta(minutes=5)
    SESSION_TYPE = "redis"
    SESSION_PERMANENT = False
    SESSION_USE_SIGNER = True
    SESSION_REDIS_URL = os.getenv("SESSION_REDIS_URL", "redis://valkey:6379/0")
    SESSION_REDIS = redis.from_url(SESSION_REDIS_URL)
    RATE_LIMIT_ENABLED = os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"
    RATE_LIMIT_STORAGE_URI = os.getenv(
        "RATE_LIMIT_STORAGE_URI", "redis://valkey:6379/1"
    )
    RATE_LIMIT_TRUSTED_PROXY_COUNT = int(
        os.getenv("RATE_LIMIT_TRUSTED_PROXY_COUNT", "0")
    )
    RATE_LIMIT_DEFAULT_CAPACITY = int(os.getenv("RATE_LIMIT_DEFAULT_CAPACITY", "300"))
    RATE_LIMIT_DEFAULT_REFILL_RATE = float(
        os.getenv("RATE_LIMIT_DEFAULT_REFILL_RATE", "5")
    )
    RATE_LIMIT_RULES = {
        "default": {
            "capacity": RATE_LIMIT_DEFAULT_CAPACITY,
            "refill_rate": RATE_LIMIT_DEFAULT_REFILL_RATE,
        },
        "heavy_read": {
            "capacity": int(os.getenv("RATE_LIMIT_HEAVY_READ_CAPACITY", "120")),
            "refill_rate": float(os.getenv("RATE_LIMIT_HEAVY_READ_REFILL_RATE", "2")),
        },
        "ingest": {
            "capacity": int(os.getenv("RATE_LIMIT_INGEST_CAPACITY", "600")),
            "refill_rate": float(os.getenv("RATE_LIMIT_INGEST_REFILL_RATE", "10")),
        },
        "export_start": {
            "capacity": int(os.getenv("RATE_LIMIT_EXPORT_CAPACITY", "5")),
            "refill_rate": float(os.getenv("RATE_LIMIT_EXPORT_REFILL_RATE", "0.033")),
        },
        "poll": {
            "capacity": int(os.getenv("RATE_LIMIT_POLL_CAPACITY", "30")),
            "refill_rate": float(os.getenv("RATE_LIMIT_POLL_REFILL_RATE", "1")),
        },
        "auth_token": {
            "capacity": int(os.getenv("RATE_LIMIT_AUTH_TOKEN_CAPACITY", "10")),
            "refill_rate": float(
                os.getenv("RATE_LIMIT_AUTH_TOKEN_REFILL_RATE", "0.167")
            ),
        },
        "auth_general": {
            "capacity": int(os.getenv("RATE_LIMIT_AUTH_GENERAL_CAPACITY", "30")),
            "refill_rate": float(
                os.getenv("RATE_LIMIT_AUTH_GENERAL_REFILL_RATE", "0.5")
            ),
        },
    }
    TTN_API_KEY = os.getenv("TTN_API_KEY")
    TTN_APP_ID = os.getenv("TTN_APP_ID")


class ProductionConfig(Config):
    FLASK_ENV = "production"


class DevelopmentConfig(Config):
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
    RATE_LIMIT_ENABLED = False
