import os

from sqlalchemy import create_engine
from sqlalchemy import text
from sqlalchemy.orm import Session

from .tables import Base

# Connect
engine = create_engine(os.environ["DB_URL"])
# Create tables
Base.metadata.create_all(engine)
# Create functions
#with Session(engine) as s:
#    this_file = os.path.abspath(os.path.dirname(__file__))
#    sql_file = "sql/create_get_formatted_power_data.sql"
#    fname = os.path.join(this_file, sql_file)
#    with open(fname) as file:
#        stmt = text(file.read())
#        s.execute(stmt)
#        s.commit()
