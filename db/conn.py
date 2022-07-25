from sqlalchemy import create_engine

from .tables import Base

# Connect
engine = create_engine("postgresql://postgres:password@localhost/dirtviz")
# Create tables
Base.metadata.create_all(engine)
