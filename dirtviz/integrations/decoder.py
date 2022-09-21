"""Decoder for data sent from RocketLoggers

Currently follows the format of a CSV with the keys in the following order::

    ts_r, v1, i1, v2, i2, raw_vwc, temp, ec

Notes
-----
    This assumes that both channels are being used. In the future when
    RocketLoggers are not the only logging utility this will have to updated to
    support that. For now the recomended solution is to ground the unused
    channel and have the data go to a garbage cell.

Todo
----
    - Update data format from CSV to something like protobuf

.. codeauthor:: John Madden <jtmadden@ucsc.edu>
"""

from datetime import datetime

from sqlalchemy.orm import Session

from ..db.conn import engine
from ..db.tables import PowerData, TEROSData
from ..db.get_or_create import get_or_create_logger, get_or_create_cell


def add_data(payload, **kwargs):
    """Adds data from payload to the database

    Parameters
    ----------
    payload : bytes
        Raw data from RocketLogger
    logger_name : str
        Name of RocketLogger
    cell1_name : str
        Name of cell connected to channel 1
    cell1_loc : str
        Location of cell connected to channel 1
    cell2_name : str
        Name of cell connected to channel 1
    cell2_loc : str
        Location of cell connected to channel 2
    """

    data = parse_rl(payload)

    with Session(engine) as sess:
        # Create logger if name does not exist
        log = get_or_create_logger(sess, kwargs["logger_name"])

        # Create cell1 if does not exist
        c1 = get_or_create_cell(sess, kwargs["cell1_name"], kwargs["cell1_loc"])
        c2 = get_or_create_cell(sess, kwargs["cell2_name"], kwargs["cell2_loc"])

        data_list = []

        # PowerData
        data_list.append(
                PowerData(
                logger_id=log.id,
                cell_id=c1.id,
                ts=data["ts"],
                current=data["i1"],
                voltage=data["v1"]
            )
        )

        data_list.append(
            PowerData(
                logger_id=log.id,
                cell_id=c2.id,
                ts=data["ts"],
                current=data["i2"],
                voltage=data["v2"]
            )
        )

        data_list.append(
            TEROSData(
                cell_id=c1.id,
                ts=data["ts"],
                vwc=data["raw_vwc"],
                temp=data["temp"],
                ec=data["ec"]
            )
        )

        data_list.append(
            TEROSData(
                cell_id=c2.id,
                ts=data["ts"],
                vwc=data["raw_vwc"],
                temp=data["temp"],
                ec=data["ec"]
            )
        )

        sess.add_all(data_list)
        sess.commit()


def parse_rl(payload):
    """Parses sent rocketlogger data

    The payload is expected to be already decoded and formatted as a csv as
    follows::

        ts_r, v1, i1, v2, i2, raw_vwc, temp, ec

    Parameters
    ----------
    payload : bytes
        Raw data sent from rocketlogger

    Returns
    -------
    dict
        Dictonary of sent data. Keys are as follows ["ts_r", "v1", "i1",
        "v2", "i2", "raw_vwc", "temp", "ec"].
    """

    split = payload.split(",")

    data = {}
    data["ts"] = datetime.now()

    # format and store
    keys = ["ts_r", "v1", "i1", "v2", "i2", "raw_vwc", "temp", "ec"]
    types = [lambda ts_str : datetime.fromtimestamp(float(ts_str)), int, int,
             int, int,int, float, float, int]
    for key, _type, meas in zip(keys, types, split):
        data[key] = _type(meas)

    return data
