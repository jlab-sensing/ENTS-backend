from flask import request, jsonify
from flask_restful import Resource
import pandas as pd
from ..database.schemas.get_cell_data_schema import GetCellDataSchema
from ..database.models.power_data import PowerData
from ..database.models.teros_data import TEROSData

get_cell_data = GetCellDataSchema()


class Cell_Data(Resource):
    def get(self, cell_id=0):
        v_args = get_cell_data.load(request.args)
        teros_data = pd.DataFrame(
            TEROSData.get_teros_data_obj(
                cell_id,
                resample=v_args["resample"],
                start_time=v_args["startTime"],
                end_time=v_args["endTime"],
            )
        )
        power_data = pd.DataFrame(
            PowerData.get_power_data_obj(
                cell_id,
                resample=v_args["resample"],
                start_time=v_args["startTime"],
                end_time=v_args["endTime"],
            )
        )

        res = pd.merge(teros_data, power_data, on="timestamp", how="outer").fillna("")
        return jsonify(res.to_dict(orient="records"))

    def post(self):
        pass
