from flask import request, jsonify
from flask_restful import Resource
import json
from json import JSONEncoder
import decimal

from datetime import date, datetime


from ..database.schemas.cell_data_schema import CellDataSchema
from ..database.models.power_data import PowerData
from ..database.models.teros_data import TEROSData
from ..database.getters import get_power_data, get_teros_data

cell_data_schema = CellDataSchema(many=True)


class Cell_Data(Resource):
    def get(self, cell_id=0):

        # {
        #     "ec": [
        #         "50.0000000000000000"
        #     ],
        #     "i": [],
        #     "p": [],
        #     "temp": [
        #         300.0
        #     ],
        #     "timestamp": [],
        #     "v": [],
        #     "vwc": [
        #         -7.383168300000001
        #     ]
        # }
        teros_data = TEROSData.get_teros_data_obj(cell_id)
        power_data = PowerData.get_power_data_obj(cell_id)
        res = teros_data | power_data
        print("teros", teros_data, flush=True)
        print("power", power_data, flush=True)
        print("res", res, flush=True)
        return jsonify(res)

    def post(self):
        pass
