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
        rl = Cell(
            name=name,
            location=location
        )

        # Add to db
        s.add(rl)
        s.commit()

        print(rl)
