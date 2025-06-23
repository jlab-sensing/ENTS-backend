"""Sensor endpoint for uploading and getting data

This endpoint is used to upload sensor data in a json format. The data is
inserted into the database.

Authors:
- John Madden <jmadden173@pm.me>
- Alec Levy <aleclevy3@gmail.com>
"""

import base64

from flask import request, jsonify, Response
from flask_restful import Resource

from .util import process_measurement_json

from ..models.sensor import Sensor
from ..schemas.get_sensor_data_schema import GetSensorDataSchema


class SensorData_Json(Resource):
    get_sensor_data_schema = GetSensorDataSchema()

    def get(self):
        """Gets specified sensor data"""

        # get args
        v_args = self.get_sensor_data_schema.load(request.args)
        stream = v_args["stream"] if "stream" in v_args else False

        # get data
        sensor_data_obj = Sensor.get_sensor_data_obj(
            name=v_args["name"],
            cell_id=v_args["cellId"],
            start_time=v_args["startTime"],
            measurement=v_args["measurement"],
            end_time=v_args["endTime"],
            stream=stream,
        )

        return jsonify(sensor_data_obj)

    def post(self):
        """Handle upload post request

        The HTTP request is checked for appropriate Content-Type then the
        measurement is decoded and inserted into the database. Both a HTTP code  and
        binary response are returned.

        Returns:
            Response indicating success or failure. See util.process_measurement
            for full description.
        """
        content_type = request.headers.get("Content-Type")

        # response to request
        resp = None

        if content_type == "application/json":
            # get uplink binary data
            data = request.data
            resp = self.handle_json(data)
        else:
            err_str = f"Content-Type header of '{content_type}' incorrect"
            raise ValueError(err_str)
        return resp

    @staticmethod
    def handle_json(data):
        """Handles POST request containing binary data and return response


        Returns:
            Response indicating success or failure. See util.process_measurement
            for full description.
        """

        content_type = request.headers.get("Content-Type")

        # check for correct content type and get json
        if content_type == "application/json":
            # get uplink json
            data = request.json
        else:
            raise ValueError("POST request must be application/json")

        # decode and insert into db
        resp = process_measurement_json(data)

        return resp
