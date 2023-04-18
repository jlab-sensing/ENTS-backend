from flask_restful import Resource
import json
from json import JSONEncoder
import decimal

from sqlalchemy.orm import Session
from sqlalchemy import select

from ..db.conn import engine
# from ..db.tables import Cell
from ..db.getters import get_power_data, get_teros_data
from datetime import date, datetime


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


class Cell(Resource):
    def get(self):
        with Session(engine) as sess:
            teros_source = get_teros_data(sess, 1)
            power_source = get_power_data(sess, 1)
        # power = json.dumps(
            # power_source, indent=4, cls=DateTimeEncoder)
        teros_source["vwc"] = list(map(vwc, teros_source["vwc"]))
        mergedData = teros_source | power_source
        print(mergedData)
        json_data = json.dumps(
            mergedData, indent=4, cls=DateTimeEncoder)
        # json_object = {
        #     # power,
        #     teros
        # }
        return json_data

    def post(self):
        pass