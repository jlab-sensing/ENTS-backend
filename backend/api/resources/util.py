"""Utility functions for interacting with the database

author: John Madden <jmadden173@pm.me>
"""

import os
from datetime import datetime

from flask import Response
from ents.proto import encode_response, decode_measurement

from ..models.sensor import Sensor
from .. import socketio

DEBUG_SOCKETIO = os.getenv("DEBUG_SOCKETIO", "False").lower() == "true"


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
    return process_measurement_dict(meas)


def process_measurement_json(data: dict):
    """Process json measurement

    Args:
        data: Json measurement

    Returns:
        Flask response with status code and protobuf encoded response.
    """

    return process_measurement_dict(data)


def process_measurement_dict(meas: dict):
    obj_list = []

    # power measurement - now uses unified data table via Sensor.add_data
    if meas["type"] == "power":
        voltage_obj = Sensor.add_data(
            meas_name="voltage", meas_unit="V", meas_dict=meas
        )
        obj_list.append(voltage_obj)

        current_obj = Sensor.add_data(
            meas_name="current", meas_unit="A", meas_dict=meas
        )
        obj_list.append(current_obj)

    # teros12 measurement - now uses unified data table via Sensor.add_data
    elif meas["type"] == "teros12":
        vwc_obj = Sensor.add_data(
            meas_name="vwcAdj", meas_unit="%", meas_dict=meas
        )
        obj_list.append(vwc_obj)

        vwc_raw_obj = Sensor.add_data(
            meas_name="vwcRaw", meas_unit="V", meas_dict=meas
        )
        obj_list.append(vwc_raw_obj)

        temp_obj = Sensor.add_data(
            meas_name="temp", meas_unit="C", meas_dict=meas
        )
        obj_list.append(temp_obj)

        ec_obj = Sensor.add_data(
            meas_name="ec", meas_unit="uS/cm", meas_dict=meas
        )
        obj_list.append(ec_obj)

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
        obj = Sensor.add_data(meas_name="matricPot", meas_unit="kPa", meas_dict=meas)

        obj_list.append(obj)

        obj = Sensor.add_data(meas_name="temp", meas_unit="C", meas_dict=meas)

        obj_list.append(obj)
    elif meas["type"] == "co2":
        obj = Sensor.add_data(meas_name="CO2", meas_unit="PPM", meas_dict=meas)

        obj_list.append(obj)

        obj = Sensor.add_data(meas_name="state", meas_unit="Boolean", meas_dict=meas)

        obj_list.append(obj)

        obj = Sensor.add_data(
            meas_name="Photoresistivity", meas_unit="Ohms", meas_dict=meas
        )

    elif meas["type"] == "pcap02":
        obj = Sensor.add_data(
            meas_name="Capacitance", meas_unit="Farads", meas_dict=meas
        )
        obj_list.append(obj)

    # sen0257 water pressure measurement
    elif meas["type"] == "sen0257":

        pressure_obj = Sensor.add_data(
            meas_name="pressure", meas_unit="kPa", meas_dict=meas
        )

        obj_list.append(pressure_obj)

        voltage_obj = Sensor.add_data(
            meas_name="voltage", meas_unit="V", meas_dict=meas
        )

        obj_list.append(voltage_obj)

    # sen0308 soil humidity measurement
    elif meas["type"] == "sen0308":

        voltage_obj = Sensor.add_data(
            meas_name="voltage", meas_unit="V", meas_dict=meas
        )

        obj_list.append(voltage_obj)

        humidity_obj = Sensor.add_data(
            meas_name="humidity", meas_unit="%", meas_dict=meas
        )

        obj_list.append(humidity_obj)

    # yfs210c water flow measurement
    elif meas["type"] == "yfs210c":

        flow_obj = Sensor.add_data(meas_name="flow", meas_unit="L/Min", meas_dict=meas)

        obj_list.append(flow_obj)

    resp = Response()
    resp.content_type = "application/octet-stream"
    if None in obj_list:
        resp.status_code = 501
        resp.data = encode_response(False)
    else:
        resp.status_code = 200
        resp.data = encode_response(True)

        cell_id = meas.get("cellId")
        if cell_id:
            try:
                measurement_data = {
                    "type": meas.get("type", "unknown"),
                    "cellId": cell_id,
                    "loggerId": meas.get("loggerId"),
                    "timestamp": meas.get("ts"),
                    "data": meas.get("data", {}),
                    "obj_count": len([obj for obj in obj_list if obj is not None]),
                }
                room_name = f"cell_{cell_id}"

                socketio.emit("measurement_received", measurement_data, room=room_name)

                if DEBUG_SOCKETIO:
                    has_subscribers = socketio.server.manager.rooms.get("/", {}).get(
                        room_name
                    )
                    if has_subscribers:
                        count = len(has_subscribers)
                        print(f"[socketio] emitted to {room_name}: {count} subscribers")
            except Exception as e:
                print(f"[socketio] error emitting measurement: {e}")

    return resp
