"""Sensor endpoint for uploading and getting data

Data can be upload through (1) The Things Network (TTN) in a json format or
(2) directly POSTed to this endpoint as binary data. The method are
differentiated by the "Content-Type" HTTP header.

TTN:
The api endpoint handles uplink messages from The Things Network (TNN). The data
payload is decoded and inserted into the database. See the following for more
information on TTN integration:
- https://www.thethingsindustries.com/docs/integrations/webhooks/creating-webhooks/.
- https://www.thethingsindustries.com/docs/the-things-stack/concepts/data-formats/.

Binary:
The measurement data is POSTed to this resource as protobuf encoded binary data
which is decoded into a dictionary containing measured values. The data is
inserted into the appropriate table in the database. A HTTP response is sent
back containing protobuf binary data with the response message indicating status
of data.

TODO:
- Integrate downlinks to device to ack the data as successfully inserted into
the db and data can be cleared from local non-volatile storage. See
https://www.thethingsindustries.com/docs/integrations/webhooks/scheduling-downlinks/

Author: John Madden <jmadden173@pm.me>
"""

import base64

from flask import request, jsonify, Response
from flask_restful import Resource

from .util import process_measurement

from ..models.sensor import Sensor
from ..schemas.get_sensor_data_schema import GetSensorDataSchema


class SensorData(Resource):
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
            measurement=v_args["measurement"],
            resample=v_args["resample"],
            start_time=v_args["startTime"],
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
            # get uplink json
            uplink_json = request.json
            resp = self.handle_ttn(uplink_json)
        elif content_type == "application/octet-stream":
            # get uplink binary data
            data = request.data
            resp = self.handle_binary(data)
        else:
            err_str = f"Content-Type header of '{content_type}' incorrect"
            raise ValueError(err_str)
        return resp

    @staticmethod
    def handle_ttn(uplink_json):
        """Handlings uplink POST request from TTN

        Sample uplink message:
        https://www.thethingsindustries.com/docs/the-things-stack/concepts/data-formats/#uplink-messages

        Args:
            uplink_json: Uplink json for TTN

        Returns:
            Response indicating success or failure. See util.process_measurement
            for full description.
        """

        # check if uplink is on correctly LoRaWAN application port
        if uplink_json["uplink_message"]["f_port"] != 1:
            # don't process and return success
            resp = Response()
            resp.status_code = 200
            return resp

        # get payload
        payload_str = uplink_json["uplink_message"]["frm_payload"]
        payload = base64.b64decode(payload_str)

        resp = process_measurement(payload)

        # TODO: Add downlink messages to device

        # return json of measurement
        return resp

    @staticmethod
    def handle_binary(data):
        """Handles POST request containing binary data and return response


        Returns:
            Response indicating success or failure. See util.process_measurement
            for full description.
        """

        content_type = request.headers.get("Content-Type")

        # check for correct content type and get json
        if content_type == "application/octet-stream":
            # get uplink json
            data = request.data
        else:
            raise ValueError("POST request must be application/json")

        # decode and insert into db
        resp = process_measurement(data)

        return resp
