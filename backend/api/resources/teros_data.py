from flask import request, jsonify
from flask_restful import Resource
from ..database.schemas.teros_data_schema import TEROSDataSchema
from ..database.schemas.t_input import TInput
from ..database.models.teros_data import TEROSData

from datetime import datetime

teros_schema = TEROSDataSchema()
t_in = TInput()


class Teros_Data(Resource):
    def post(self):
        json_data = request.json
        teros_data_obj = t_in.load(json_data)
        cell_name = teros_data_obj['cell']
        ts = datetime.fromtimestamp(json_data['ts'] // 1000000000)
        vwc = teros_data_obj['vwc']
        raw_vwc = teros_data_obj['raw_vwc']
        temp = teros_data_obj['temp']
        ec = teros_data_obj['ec']
        water_pot =teros_data_obj['water_pot']
        new_teros_data = TEROSData.add_teros_data(
            cell_name, ts, vwc, raw_vwc, temp, ec, water_pot)
        return teros_schema.jsonify(new_teros_data)

    def get(self, cell_id=0):
        return jsonify(TEROSData.get_teros_data_obj(cell_id))