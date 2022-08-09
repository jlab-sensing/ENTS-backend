from sqlalchemy import (Table, Column, Integer, String, Text, ForeignKey,
                        Float, DateTime)
from sqlalchemy.dialects.postgresql import MACADDR, ARRAY
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func


Base = declarative_base()


class Logger(Base):
    __tablename__ = "logger"

    id = Column(Integer, primary_key=True)
    name = Column(Text(), nullable=False, unique=True)
    mac = Column(MACADDR)
    hostname = Column(Text())

    def __repr__(self):
        return f"Logger(id={self.id!r}, name={self.name!r})"


class Cell(Base):
    __tablename__ = "cell"

    id = Column(Integer, primary_key=True)
    name = Column(Text(), nullable=False, unique=True)
    location = Column(Text())

    def __repr__(self):
        return f"Cell(id={self.id!r}, name={self.name!r}, location={self.location!r})"


class PowerData(Base):
    __tablename__ = "power_data"

    id = Column(Integer, primary_key=True)
    logger_id = Column(Integer, ForeignKey("logger.id"))
    cell_id = Column(Integer, ForeignKey("cell.id", ondelete="CASCADE"),
                     nullable=False)
    ts = Column(DateTime, nullable=False)
    ts_server = Column(DateTime, server_default=func.now())
    current = Column(Integer)
    voltage = Column(Integer)

    logger = relationship("Logger")
    cell = relationship("Cell")

    def __repr__(self):
        return f"PowerData(id={self.id!r}, logger_id={self.logger_id!r}, cell_id={self.cell_id!r}, ts={self.ts!r}, current={self.current!r}, voltage={self.voltage!r})"


class TEROSData(Base):
    __tablename__ = "teros_data"

    id = Column(Integer, primary_key=True)
    cell_id = Column(Integer, ForeignKey("cell.id", ondelete="CASCADE"),
                     nullable=False)
    ts = Column(DateTime, nullable=False)
    ts_server = Column(DateTime, server_default=func.now())
    vwc = Column(Float)
    temp = Column(Float)
    ec = Column(Integer)

    cell = relationship("Cell")

    def __repr__(self):
        return f"TEROSData(id={self.id!r}, cell_id={self.cell_id!r}, ts={self.ts!r}, vwc={self.vwc!r}, temp={self.temp!r}, ec={self.ec!r})"
