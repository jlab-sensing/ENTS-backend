from sqlalchemy import Table, Column, Integer, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import MACADDR, TIMESTAMP
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

class PowerData(Base):
    __tablename__ = "PowerData"

    Id = Column(Integer, primary_key=True)
    RocketLogger_Id = Column(Integer, ForeignKey("RocketLoggers.Id"),
                             nullable=False)
    Cell_Id = Column(Integer, ForeignKey("Cells.Id"), nullable=False)
    Timestamp = Column(TIMESTAMP)
    Current = Column(Integer)
    Voltage = Column(Integer)

    RocketLogger = relationship("RocketLoggers",
                                foreign_keys="RocketLoggers.Id")
    Cell = relationship("Cells", foreign_keys="Cells.Id")

    def __repr__(self):
        r = f"""PowerData(Id={self.Id!r},
        RocketLogger_Id={self.RocketLogger_Id!r}, Cell_Id={self.Cell_Id!r},
        Timestamp={self.Timestamp!r}, Current={self.Current!r},
        Voltage={self.Voltage!r})"""

        return r
