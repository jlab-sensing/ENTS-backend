"""Connection module

Creates an engine based on the `DB_URL` envionment variable.

Example
-------
Create connection::

    $ from db.conn import engine

Attributes
----------
engine : sqlalchemy.Engine
    Global engine to initialize sessions with. Based on `DB_URL` environment
    variable.
"""

import os

from sqlalchemy import create_engine
from sqlalchemy.engine import URL

dburl = URL.create(
    "postgresql",
    username=os.getenv("DB_USER"),
    password=os.getenv("DB_PASS"),
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT"),
    database=os.getenv("DB_DATABASE"),
)

# Connect
engine = create_engine(dburl)
