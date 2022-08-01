from sqlalchemy import select

from .tables import Logger, Cell


def get_or_create_logger(s, name, mac=None, hostname=None):
    """Get or create Logger object

    Returns
    -------
    Logger object
    """

    stmt = Select(Logger).where(Logger.name==name)
    if mac:
        stmt = stmt.where(Logger.mac==mac)
    if hostname:
        stmt = stmt.where(Logger.hostname==hostname)

    l = s.execute(stmt).one_or_none()

    if not l:
        l = Logger(name=name, mac=mac, hostname=hostname)
        s.add(l)
        s.flush()

    return l


def get_or_create_cell(s, name, location=None):
    """Get or create Cell objects

    Returns
    -------
    Cell object
    """

    stmt = Select(Cell).where(Cell.name==name)
    if location:
        stmt = stmt.where(Cell.location=location)

    c = s.execute(stmt).one_or_none()

    if not c:
        c = Cell(name=name, location=location)
        s.add(c)
        s.flush()

    return c
