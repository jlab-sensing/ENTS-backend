from flask import request, jsonify
from flask_restful import Resource
import pandas as pd
from ..database.schemas.get_cell_data_schema import GetCellDataSchema
from ..database.models.power_data import PowerData
from ..database.models.teros_data import TEROSData
from ..database.models.sensor import Sensor
from functools import reduce

get_cell_data = GetCellDataSchema()


class Cell_Data(Resource):
    def get(self):
        v_args = get_cell_data.load(request.args)
        cell_ids = v_args["cellIds"].split(',')
        for cell_id in cell_ids:
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
            sensor_data = pd.DataFrame(
                Sensor.get_sensor_data_obj(
                    name='phytos31',
                    cell_id=cell_id,
                    measurement='voltage',
                    resample=v_args["resample"],
                    start_time=v_args["startTime"],
                    end_time=v_args["endTime"],
                )
            )

        data_frames = [teros_data, power_data, sensor_data]
        df_merged = reduce(lambda  left,right: pd.merge(left,right,on=['timestamp'],
                                            how='outer'), data_frames).fillna('void')
        return jsonify(df_merged.to_dict(orient="records"))
        

    def post(self):
        pass
