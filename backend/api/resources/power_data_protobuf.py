from flask import request, jsonify, make_response
from flask_restful import Resource
from ..database.schemas.power_data_schema import PowerDataSchema
from ..database.schemas.get_cell_data_schema import GetCellDataSchema
from ..database.schemas.p_input import PInput
from ..database.models.power_data import PowerData
from soil_power_sensor_protobuf import encode, decode

from datetime import datetime

power_schema = PowerDataSchema()
get_cell_data = GetCellDataSchema()
p_in = PInput()


class Power_Data_Protobuf(Resource):
    def post(self):
        meas_power = decode(request.data)

        new_pwr_data = PowerData.add_protobuf_power_data(
            meas_power["loggerId"],
            meas_power["cellId"],
            datetime.fromtimestamp(meas_power["ts"]),
            meas_power["voltage"],
            meas_power["current"],
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
            PowerData.get_power_data_obj(
                cell_id, start_time=v_args["startTime"], end_time=v_args["endTime"]
            )
        )
