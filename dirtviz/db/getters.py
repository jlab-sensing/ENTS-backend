from sqlalchemy import select
from sqlalchemy import text
from sqlalchemy import func

from .tables import TEROSData

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

def get_teros_data(s, cell_id, resample='hour'):
    """Gets the TEROS-12 sensor data for a given cell. Returned dictionary can
    be passed directly to bokeh.ColumnDataSource.

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
        'vwc': [],
        'temp': [],
        'ec': []
    }

    stmt = (
        select(TEROSData)
        .where(TEROSData.cell_id == cell_id)
    )

    for row in s.scalars(stmt):
        data['timestamp'].append(row.ts)
        data['vwc'].append(row.raw_VWC)
        data['temp'].append(row.temperature)
        data['ec'].append(row.ec)

    return data
