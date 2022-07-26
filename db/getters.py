from sqlalchemy import select
from sqlalchemy import text

def get_power_data(s, cell_id):
    """Gets the power data for a given cell. Can be directly passed to
    bokeh.ColumnDataSource.

    Parmaters
    ---------
    s : sqlalchemy.orm.Session
        Session to use
    cell_id : int
        Valid Cell.id

    Returns
    -------
    dict
        Dictionary of lists with keys named after columns of the table
        {
            'timestamp': [],
            'v': [],
            'i': [],
            'p': []
        }
    """

    data = {
        'timestamp': [],
        'v': [],
        'i': [],
        'p': [],
    }

    stmt = text("""
        SELECT ts, voltage, current,power
        FROM get_formatted_power_data(:cell_id)
                """).bindparams(cell_id=cell_id)

    for row in s.execute(stmt):
        data["timestamp"].append(row.ts)
        data["v"].append(row.voltage)
        data["i"].append(row.current)
        data["p"].append(row.power)

    return data

