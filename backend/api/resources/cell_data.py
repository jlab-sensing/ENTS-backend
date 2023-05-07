from flask import request, jsonify
from flask_restful import Resource
import json
from json import JSONEncoder
import decimal

from sqlalchemy.orm import Session
from sqlalchemy import select

from ..conn import engine
from ..getters import get_power_data, get_teros_data
from datetime import date, datetime
import csv



class DateTimeEncoder(JSONEncoder):
    # Override the default method
    def default(self, obj):
        if isinstance(obj, (date, datetime)):
            return obj.isoformat()
        if isinstance(obj, decimal.Decimal):
            return float(obj)
        return json.JSONEncoder.default(self, obj)


def vwc(raw):
    return (6.771*(10**-10)) * (raw**3) + (-5.105*(10**-6)) * (raw**2) + (1.302*(10**-2)) * (raw) - 10.848


class Cell_Data(Resource):
    def get(self, cell_id=0):
    # def get(self, cell_id=0, start_date="", end_date=""):
        # classes = request.args.getlist('cell_id') 
        with Session(engine) as sess:
            teros_source = get_teros_data(sess, cell_id)
            power_source = get_power_data(sess, cell_id)
        teros_source["vwc"] = list(map(vwc, teros_source["vwc"]))
        mergedData = teros_source | power_source
        # json_data = json.dumps(
        #     mergedData, indent=4, cls=DateTimeEncoder)
        return jsonify(mergedData)

    def post(self):
        pass
