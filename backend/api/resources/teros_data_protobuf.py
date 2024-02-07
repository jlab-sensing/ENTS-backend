from flask import request, jsonify, make_response
from flask_restful import Resource
from ..database.schemas.teros_data_schema import TEROSDataSchema
from ..database.schemas.get_cell_data_schema import GetCellDataSchema
from ..database.schemas.t_input import TInput
from ..database.models.teros_data import TEROSData
from soil_power_sensor_protobuf import encode, decode

from datetime import datetime

teros_schema = TEROSDataSchema()
get_cell_data = GetCellDataSchema()
t_in = TInput()


class Teros_Data_Protobuf(Resource):
    def post(self):
        meas_teros = decode(request.data)

        new_pwr_data = TEROSData.add_protobuf_power_data(
            meas_teros["cellId"],
            datetime.fromtimestamp(meas_teros["ts"]),
            meas_teros["vwcAdj"],
            meas_teros["vwcRaw"],
            meas_teros["temp"],
            meas_teros["ec"],
        )
        if new_pwr_data is None:
            # missing cell_id or logger_id in table
            encoded_data = encode(success=False)
            response = make_response(encoded_data)
            response.headers["content-type"] = "text/octet-stream"
            response.status_code = 500
            return response
        encoded_data = encode(success=True)
        response = make_response(encoded_data)
        response.headers["content-type"] = "text/octet-stream"
        response.status_code = 201
        return response

    def get(self, cell_id=0):
        v_args = get_cell_data.load(request.args)
        return jsonify(
            TEROSData.get_teros_data_obj(
                cell_id, start_time=v_args["startTime"], end_time=v_args["endTime"]
            )
        )
