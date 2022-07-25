import pdb

from sqlalchemy.orm import Session

from .tables import RocketLogger, Cell, PowerData, TEROSData
from .conn import engine


def add_cell(name, location=None) -> Cell:
    """Adds a new Cell

    Parameters
    ----------
    name : str
        Name of the Cell
    location : str
        Location of the Cell

    Returns
    -------
    Reference to newly created Cell object
    """

    #pdb.set_trace()


    with Session(engine) as s:
        # Create new object
        c = Cell(
            name=name,
            location=location
        )

        # Add to db
        s.add(c)
        s.commit()

        print(c)


def add_rl(mac=None, hostname=None) -> RocketLogger:
    """Adds a new rocketlogger

    Parameters
    ----------
    mac : str
        MAC Address of the RocketLogger
    hostname : str
        FQDN of the RocketLogger

    Returns
    -------
    Reference to created RocketLogger object
    """

    with Session(engine) as s:
        # Create new object
        rl = RocketLogger(
            mac=mac,
            hostname=hostname,
        )

        s.add(rl)
        s.commit()

        print(rl)
