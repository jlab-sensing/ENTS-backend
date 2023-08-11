from flask import request, jsonify
from flask_restful import Resource
from ..database.schemas.power_data_schema import PowerDataSchema
from ..database.schemas.get_cell_data_schema import GetCellDataSchema
from ..database.schemas.p_input import PInput
from ..database.models.power_data import PowerData

from datetime import datetime

power_schema = PowerDataSchema()
get_cell_data = GetCellDataSchema()
p_in = PInput()


class Power_Data(Resource):
    def post(self):
        json_data = request.json
        power_data_obj = p_in.load(json_data)
        logger_name = power_data_obj["logger"]
        cell_name = power_data_obj["cell"]
        ts = datetime.fromtimestamp(json_data["ts"])
        voltage = power_data_obj["v"]
        current = power_data_obj["i"]
        new_pwr_data = PowerData.add_power_data(
            logger_name, cell_name, ts, voltage, current
        )
        return power_schema.jsonify(new_pwr_data)

    def get(self, cell_id=0):
        v_args = get_cell_data.load(request.args)
        return jsonify(
            PowerData.get_power_data_obj(
                cell_id, start_time=v_args["startTime"], end_time=v_args["endTime"]
            )
        )
