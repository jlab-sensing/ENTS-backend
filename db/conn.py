import os

from sqlalchemy import create_engine

from .tables import Base

# Connect
engine = create_engine(os.environ["DB_URL"], echo=True)
# Create tables
Base.metadata.create_all(engine)
