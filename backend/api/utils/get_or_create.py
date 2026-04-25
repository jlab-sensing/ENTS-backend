"""Helper functions to get or create objects

Notes
-----
All functions must have a `sess` argument so that multiple functions can be
called while retaining object data from queried objects.
"""

from sqlalchemy import select

from ..models.logger import Logger
from ..models.cell import Cell


def get_or_create_logger(sess, name, mac=None, hostname=None):
    """Get or create Logger object

    Returns
    -------
    Logger
        Object with the inputted attributes
    """

    stmt = select(Logger).where(Logger.name == name)
    # Logger model currently has no mac/hostname columns; keep params for
    # backwards compatibility but ignore them for querying.

    log = sess.execute(stmt).one_or_none()

    if not log:
        # Logger model doesn't accept mac/hostname; keep creation minimal
        # for import flows.
        log = Logger(name=name)
        sess.add(log)
        sess.flush()
    else:
        log = log[0]

    return log


def get_or_create_cell(
    sess,
    name,
    location=None,
    lattitude=None,
    longitude=None,
    archive=False,
    user_id=None,
):
    """Get or create Cell objects

    Returns
    -------
    Cell object
    """

    stmt = select(Cell).where(Cell.name == name)
    if location:
        stmt = stmt.where(Cell.location == location)

    cell = sess.execute(stmt).one_or_none()

    if not cell:
        cell = Cell(
            name=name,
            location=location,
            latitude=lattitude,
            longitude=None,
            archive=False,
            user_id=None,
        )
        sess.add(cell)
        sess.flush()
    else:
        cell = cell[0]

    return cell
