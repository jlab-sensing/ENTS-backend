from .tables import Base
from sqlalchemy import create_engine

engine = create_engine("postgresql://postgres:password@localhost/dirtviz")
Base.metadata.create_all(engine)
