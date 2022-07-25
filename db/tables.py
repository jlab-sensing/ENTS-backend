from sqlalchemy import Table, Column, Integer, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import MACADDR
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

class RocketLogger(Base):
    __tablename__ = "RocketLoggers"

    Id = Column(Integer, primary_key=True)
    MAC = Column(MACADDR)
    hostname = Column(Text())

    def __repr__(self):
        return f"RocketLogger(Id={self.Id!r}, MAC={self.MAC!r}, hostname={self.hostname!r}"

