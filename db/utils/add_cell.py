from sqlalchemy.orm import Session

from ..conn import engine
from ..tables import Cell


def add_cell(name, location=None):
    """Adds a new Cell

    Parameters
    ----------
    name : str
        Name of the Cell
    location : str
        Location of the Cell
    """

    with Session(engine) as s:
        # Create new object
        c = Cell(
            name=name,
            location=location
        )

        # Add to db
        s.add(c)
        s.commit()

        return c.__repr__()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Add cell utility")
    parser.add_argument("name", type=str, help="Name of cell")
    parser.add_argument("location", type=str, help="Location of cell")

    args = parser.parse_args()

    print(add_cell(args.name, args.location))
