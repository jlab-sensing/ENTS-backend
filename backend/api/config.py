"""Configuration module

Environment variables for flask application

"""

import os
from .conn import dburl


class Config(object):
    SECRET_KEY = os.environ.get("SECRET_KEY") or "super-secret-key"
    DEBUG = True
    CSRF_ENABLED = True
    SQLALCHEMY_DATABASE_URI = dburl
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}
