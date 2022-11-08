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

dburl = URL(
    "postgresql",
    username=os.environ["DB_USER"],
    password=os.environ["DB_PASS"],
    host=os.environ["DB_HOST"],
    port=os.environ["DB_PORT"],
    database=os.environ["DB_DATABASE"]
)

# Connect
engine = create_engine(dburl)
