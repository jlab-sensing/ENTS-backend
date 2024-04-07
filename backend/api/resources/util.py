"""Utility functions for interacting with the database

author: John Madden <jmadden173@pm.me>
"""

from datetime import datetime

from flask import Response
from soil_power_sensor_protobuf import encode_response, decode_measurement

from ..database.models.power_data import PowerData
from ..database.models.teros_data import TEROSData


def process_measurement(data: bytes):
    """Process protobuf encoded measurement

    The byte string gets decoded through protobuf and inserted into the
    associated table. Upon successful insertion, a 200 response is sent back. On
    failure when the server does not know how to handle a measurement type, a
    501 response is sent. Both cases have serialized response messages sent
    back.

    Args
        data: Encoded measurement message

    Returns:
        Flask response with status code and protobuf encoded response.
    """

    # decode binary protobuf data
    meas = decode_measurement(data)

    # power measurement
    if meas["type"] == "power":
        db_obj = PowerData.add_protobuf_power_data(
            meas["loggerId"],
            meas["cellId"],
            datetime.fromtimestamp(meas["ts"]),
            meas["data"]["voltage"],
            meas["data"]["current"],
        )

    # teros12 measurement
    elif meas["type"] == "teros12":
        db_obj = TEROSData.add_protobuf_teros_data(
            meas["cellId"],
            datetime.fromtimestamp(meas["ts"]),
            meas["data"]["vwcAdj"],
            meas["data"]["vwcRaw"],
            meas["data"]["temp"],
            meas["data"]["ec"],
            None,
        )

    # format response
    resp = Response()
    resp.content_type = "application/octet-stream"
    # indicate a success with 200
    if db_obj is not None:
        resp.status_code = 200
        resp.data = encode_response(True)
    # indicate an error with 501
    else:
        resp.status_code = 501
        resp.data = encode_response(False)

    return resp
