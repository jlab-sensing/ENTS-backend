"""Helper functions to get or create objects

Notes
-----
All functions must have a `sess` argument so that multiple functions can be
called while retaining object data from queried objects.
"""

from sqlalchemy import select

from .models.logger import Logger
from .models.cell import Cell


def get_or_create_logger(sess, name, mac=None, hostname=None):
    """Get or create Logger object

    Returns
    -------
    Logger
        Object with the inputted attributes
    """

    stmt = select(Logger).where(Logger.name == name)
    if mac:
        stmt = stmt.where(Logger.mac == mac)
    if hostname:
        stmt = stmt.where(Logger.hostname == hostname)

    log = sess.execute(stmt).one_or_none()

    if not log:
        log = Logger(name=name, mac=mac, hostname=hostname)
        sess.add(log)
        sess.flush()
    else:
        log = log[0]

    return log


def get_or_create_cell(sess, name, location=None):
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
        cell = Cell(name=name, location=location)
        sess.add(cell)
        sess.flush()
    else:
        cell = cell[0]

    return cell
