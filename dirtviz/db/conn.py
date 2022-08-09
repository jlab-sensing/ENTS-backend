import os

from sqlalchemy import create_engine
from sqlalchemy import text
from sqlalchemy.orm import Session

from .tables import Base

# Connect
engine = create_engine(os.environ["DB_URL"])
# Create tables
Base.metadata.create_all(engine)
