import pdb
import csv
from datetime import datetime

from tqdm import tqdm
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


def import_rl(path, rl, cell1=None, cell2=None):
    """Imports raw RocketLogger data in PowerData table.

    Expects columns in the following format
    timestamp,I1L_valid,I2L_valid,I1H [nA],I1L [10pA],V1 [10nV],V2 [10nV],I2H [nA],I2L [10pA]

    Parameters
    ----------
    path : str
        Path to csv file.
    rl : RocketLogger
        Reference to RocketLogger.
    cell1 : Cell
        Reference to cell being measured on channel 1.
    cell2 : Cell
        Reference to cell being measured on channel 2.

    Returns
    -------
    """

    with open(path, newline='') as csvfile:
        rl_reader = csv.reader(csvfile)

        # Skip header
        for _ in range(11):
            rl_reader.__next__()

        with Session(engine) as s:
            for row in tqdm(rl_reader):
                # convert string to timestamp
                ts = datetime.fromtimestamp(float(row[0]))

                pow1 = PowerData(
                    rocketlogger_id=rl,
                    cell_id=cell1,
                    timestamp=ts,
                    current=row[4],
                    voltage=row[5],
                )

                pow2 = PowerData(
                    rocketlogger_id=rl,
                    cell_id=cell1,
                    timestamp=ts,
                    current=row[8],
                    voltage=row[6],
                )

                s.add_all([pow1, pow2])

            s.commit()
