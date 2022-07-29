from sqlalchemy import (Table, Column, Integer, String, Text, ForeignKey,
                        Float, DateTime)
from sqlalchemy.dialects.postgresql import MACADDR, ARRAY
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import relationship


Base = declarative_base()


class RocketLogger(Base):
    __tablename__ = "rocketlogger"

    id = Column(Integer, primary_key=True)
    mac = Column(MACADDR)
    hostname = Column(Text())

    def __repr__(self):
        return f"RocketLogger(id={self.id!r}, MAC={self.mac!r}, hostname={self.hostname!r}"


class Cell(Base):
    __tablename__ = "cell"

    id = Column(Integer, primary_key=True)
    name = Column(Text())
    location = Column(Text())

    def __repr__(self):
        return f"Cell(id={self.id!r}, Name={self.name!r}, Location={self.location!r}"


class PowerData(Base):
    __tablename__ = "power_data"

    id = Column(Integer, primary_key=True)
    rocketlogger_id = Column(Integer, ForeignKey("rocketlogger.id"),
                             nullable=False)
    cell_id = Column(Integer, ForeignKey("cell.id"), nullable=False)
    ts = Column(DateTime)
    current = Column(Integer)
    voltage = Column(Integer)

    rocketlogger = relationship("RocketLogger")
    cell = relationship("Cell")

    def __repr__(self):
        return f"PowerData(id={self.id!r}, RocketLogger_id={self.locketlogger_id!r}, cell_id={self.cell_id!r}, ts={self.ts!r}, current={self.current!r}, voltage={self.voltage!r})"


class TEROSData(Base):
    __tablename__ = "teros_data"

    id = Column(Integer, primary_key=True)
    cell_id = Column(Integer, ForeignKey("cell.id"), nullable=False)
    ts = Column(DateTime)
    sensorid = Column(String(1))
    raw_VWC = Column(Float)
    temperature = Column(Float)
    ec = Column(Integer)

    cell = relationship("Cell")

    def __repr__(self):
        return f"TEROSData(id={self.id!r}, cell_id={self.cell_id!r}, ts={self.ts!r}, sensorid={self.sensorid!r}, raw_VWC={self.raw_VWC!r}, temperature={self.temperature!r}, ec={self.ec!r})"
