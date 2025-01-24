"""Utility functions for interacting with the database

author: John Madden <jmadden173@pm.me>
"""

from datetime import datetime

from flask import Response
from soil_power_sensor_protobuf.proto import encode_response, decode_measurement

from ..models.power_data import PowerData
from ..models.teros_data import TEROSData
from ..models.sensor import Sensor


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
    meas = decode_measurement(data, raw=False)

    obj_list = []

    # power measurement
    if meas["type"] == "power":
        obj = PowerData.add_protobuf_power_data(
            meas["loggerId"],
            meas["cellId"],
            datetime.fromtimestamp(meas["ts"]),
            meas["data"]["voltage"],
            meas["data"]["current"],
        )

        obj_list.append(obj)

    # teros12 measurement
    elif meas["type"] == "teros12":
        obj = TEROSData.add_protobuf_teros_data(
            meas["cellId"],
            datetime.fromtimestamp(meas["ts"]),
            meas["data"]["vwcAdj"],
            meas["data"]["vwcRaw"],
            meas["data"]["temp"],
            meas["data"]["ec"],
            None,
        )

        obj_list.append(obj)

    elif meas["type"] == "phytos31":
        obj1 = Sensor.add_data(meas_name="voltage", meas_unit="V", meas_dict=meas)

        obj_list.append(obj1)

        obj2 = Sensor.add_data(meas_name="leafWetness", meas_unit="?", meas_dict=meas)

        obj_list.append(obj2)

    elif meas["type"] == "bme280":
        pressure_obj = Sensor.add_data(
            meas_name="pressure", meas_unit="hPa", meas_dict=meas
        )
        obj_list.append(pressure_obj)

        temperature_obj = Sensor.add_data(
            meas_name="temperature", meas_unit="C", meas_dict=meas
        )
        obj_list.append(temperature_obj)

        humidity_obj = Sensor.add_data(
            meas_name="humidity", meas_unit="%", meas_dict=meas
        )
        obj_list.append(humidity_obj)

    elif meas["type"] == "teros21":
        obj = Sensor.add_data(meas_name="matric_pot", meas_unit="kPa", meas_dict=meas)

        obj_list.append(obj)

        obj = Sensor.add_data(meas_name="temp", meas_unit="C", meas_dict=meas)

        obj_list.append(obj)

    # format response
    resp = Response()
    resp.content_type = "application/octet-stream"
    # indicate an error with 501
    if None in obj_list:
        resp.status_code = 501
        resp.data = encode_response(False)
    # indicate a success with 200
    else:
        resp.status_code = 200
        resp.data = encode_response(True)

    return resp
