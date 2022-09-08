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

# Connect
engine = create_engine(os.environ["DB_URL"])
