from flask import request, jsonify
from flask_restful import Resource
import pandas as pd
from ..schemas.get_cell_data_schema import GetCellDataSchema
from ..models.power_data import PowerData
from ..models.teros_data import TEROSData
from ..models.sensor import Sensor
from functools import reduce
from io import StringIO
from celery import shared_task

get_cell_data = GetCellDataSchema()


@shared_task(bind=True, ignore_result=False)
def stream_csv(self, request_args):
    """Creates a task that queries cell data and writes into buffer

    Arguments:
    request_args -- arguments of the request being made
    """
    v_args = get_cell_data.load(request_args)
    cell_ids = v_args["cellIds"].split(",")
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
                name="phytos31",
                cell_id=cell_id,
                measurement="voltage",
                resample=v_args["resample"],
                start_time=v_args["startTime"],
                end_time=v_args["endTime"],
            )
        )

        data_frames = [
            teros_data.to_json(),
            power_data.to_json(),
            sensor_data.to_json(),
        ]

        data_frames = map(lambda df_json: pd.read_json(StringIO(df_json)), data_frames)

        df_merged = reduce(
            lambda left, right: pd.merge(left, right, on=["timestamp"], how="outer"),
            data_frames,
        ).fillna("void")

        csv_buffer = StringIO()
        df_merged.to_csv(csv_buffer, index=False)

        return csv_buffer.getvalue()


class Cell_Data(Resource):
    def get(self):
        result = stream_csv.delay(request.args)
        return jsonify({"result_id": result.id})

    def post(self):
        pass
