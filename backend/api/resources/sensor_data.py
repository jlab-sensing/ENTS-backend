from flask import request, jsonify
from flask_restful import Resource
from ..database.schemas.data_schema import DataSchema
from ..database.schemas.get_sensor_data_schema import GetSensorDataSchema
from ..database.models.sensor import Sensor

from datetime import datetime

data_schema = DataSchema()
get_sensor_data_schema = GetSensorDataSchema()


class Sensor_Data(Resource):
    def post(self):
        meas_sensor = {
            "type": "sensor_leaf",
            "cellId": "1",
            "data": {"power": 3, "current": 6},
            "data_type": {"power": "float", "current": "int"},
            "ts": 1705176162,
        }

        for measurement, data in meas_sensor["data"].items():
            Sensor.add_data(
                meas_sensor["cellId"],
                meas_sensor["type"],
                measurement,
                data,
                meas_sensor["data_type"],
                datetime.fromtimestamp(meas_sensor["ts"]),
            )
        return {"msg": "added data"}, 201

    def get(self, sensor_id=0):
        v_args = get_sensor_data_schema.load(request.args)
        sensor_obj = Sensor.get_sensor_data_obj(
            sensor_id,
            start_time=v_args["startTime"],
            end_time=v_args["endTime"],
        )
        if sensor_obj is None:
            return {"msg": "sensor not found"}, 400
        return jsonify(sensor_obj)
