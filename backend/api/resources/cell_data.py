from flask import request, jsonify
from flask_restful import Resource
import json
from json import JSONEncoder
import decimal

from ..conn import engine
from datetime import date, datetime


from ..database.schemas.cell_data_schema import CellDataSchema
from ..database.models.power_data import PowerData
from ..database.models.teros_data import TEROSData
from ..database.getters import get_power_data, get_teros_data

cell_data_schema = CellDataSchema(many=True)


class Cell_Data(Resource):
    def get(self, cell_id=0):
        # # def get(self, cell_id=0, start_date="", end_date=""):
        #     # classes = request.args.getlist('cell_id')
        # with Session(engine) as sess:
        #     teros_source = get_teros_data(sess, cell_id)
        #     power_source = get_power_data(sess, cell_id)
        #     teros_source["vwc"] = list(map(vwc, teros_source["vwc"]))
        #     mergedData = teros_source | power_source
        #     # json_data = json.dumps(
        #     #     mergedData, indent=4, cls=DateTimeEncoder)
        #     return jsonify(mergedData)
        # TEROS_data = TEROSData.queryfilter_by(cell_id=cell_id)
        # power_data = PowerData.query.get(cell_id)
        # print(TEROS_data, flush=True)
        # # cells = CellData.query.byId
        # return cell_datas_schema.dump([TEROS_data, power_data])
        # cells = Cell.query.all()
        # return cells_schema.dump(cells)
        # sub_query = session.query(TEROSData).filter(
        #     TEROSData.cell_id == cell_id).subquery()
        # print(sub_query, flush=True)

        # session.query(Cell).select_from(Cell).join(
        #     sub_query, Cell.id == sub_query.c.cell_id).filter(Cell.id == cell_id)

        # query=session.query(Residents)
        # cell_data = session.query(Cell).filter(Cell.id == cell_id)
        # filter(Cell.id == cell_id)
        # Cell.query.join(TEROSData, Cell.id == TEROSData.cell_id)
        # .join(
        #     PowerData, Cell.id == PowerData.cell_id)
        # Session.query(Cell, TEROSData, PowerData).join(
        #     TEROSData).join(PowerData)
        # players = PlayerInfo.query.join(
        #     OffensiveStats, PlayerInfo.player_id == OffensiveStats.player_id)
        # schema = CellDataSchema()
        # .filter(Cell.id == cell_id).all()
        # t_d = TEROSData.query.group_by(func.date_trunc('hour', TEROSData.ts))
        # cell_data = Cell.query.join(TEROSData).group_by(
        #     func.date_trunc('hour', Cell.teros_data.ts))

        teros_data = TEROSData.get_teros_data_obj(cell_id)
        power_data = PowerData.get_power_data_obj(cell_id)
        res = teros_data | power_data
        # res = [(d1 | d2)
        #        for d1, d2 in zip(teros_data, power_data)]
        # print(res, flush=True)
        # return cell_data_schema.dump(res)
        return jsonify(res)

    def post(self):
        pass
