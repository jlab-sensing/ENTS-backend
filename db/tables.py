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
        r = f"""RocketLogger(Id={self.Id!r}, MAC={self.MAC!r},
        hostname={self.hostname!r}"""

        return r

class Cell(Base):
    __tablename__ = "Cells"

    Id = Column(Integer, primary_key=True)
    Name = Column(Text())
    Location = Column(Text())

    def __repr__(self):
        r = f"""Cell(Id={self.Id!r}, Name={self.Name!r},
        Location={self.Location!r}"""

        return r
