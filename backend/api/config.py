"""Configuration module

Environment variables for flask application

"""

import os
from .conn import dburl
from datetime import timedelta
import redis
from sqlalchemy.engine import URL


class Config(object):
    SECRET_KEY = os.environ.get("SECRET_KEY") or "super-secret-key"
    DEBUG = True
    CSRF_ENABLED = True
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}
    # SQLALCHEMY_ECHO = True
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
    REDIRECT_URI = os.getenv("OAUTH_REDIRECT_URI")
    SESSION_COOKIE_NAME = "google-login-session"
    PERMANENT_SESSION_LIFETIME = timedelta(minutes=5)

    SESSION_TYPE = "redis"
    SESSION_PERMANENT = False
    SESSION_USE_SIGNER = True
    SESSION_REDIS = redis.from_url("redis://redis:6379")


class ProductionConfig(Config):
    SQLALCHEMY_DATABASE_URI = dburl
    FLASK_ENV = "production"


class DevelopmentConfig(Config):
    SQLALCHEMY_DATABASE_URI = dburl
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.environ["TEST_SQLALCHEMY_DATABASE_URI"]
