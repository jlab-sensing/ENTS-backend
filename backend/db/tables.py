"""Module for sqlalchmey defined database tables

.. codeauthor:: John Madden <jtmadden@ucsc.edu>
"""

# pylint: disable=too-few-public-methods

from sqlalchemy import Column, Integer,  Text, ForeignKey, Float, DateTime
from sqlalchemy.dialects.postgresql import MACADDR
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func


Base = declarative_base()


class Logger(Base):
    """Table of logging hardware"""

    __tablename__ = "logger"

    id = Column(Integer, primary_key=True)
    name = Column(Text(), nullable=False, unique=True)
    mac = Column(MACADDR)
    hostname = Column(Text())

    def __repr__(self):
        return repr(self.name)


class Cell(Base):
    """Table of cells"""

    __tablename__ = "cell"

    id = Column(Integer, primary_key=True)
    name = Column(Text(), nullable=False, unique=True)
    location = Column(Text())

    def __repr__(self):
        return repr(self.name)


class PowerData(Base):
    """Table for power measurements"""

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
        return f"PowerData(id={self.id!r}, ts={self.ts!r})"


class TEROSData(Base):
    """Table for TEROS-12 Data"""

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
        return f"TEROSData(id={self.id!r}, ts={self.ts!r})"
