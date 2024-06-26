from flask import request, Response, stream_with_context, jsonify, current_app
from flask_restful import Resource
import pandas as pd
from ..database.schemas.get_cell_data_schema import GetCellDataSchema
from ..database.models.power_data import PowerData
from ..database.models.teros_data import TEROSData
from ..database.models.sensor import Sensor
from functools import reduce
import io
from celery import shared_task
# import zipfile

get_cell_data = GetCellDataSchema()

@shared_task(bind=True, ignore_result=False)
def stream_csv(self, request_args):
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

        data_frames = [teros_data.to_json(), power_data.to_json(), sensor_data.to_json()]

        def generate_csv():
            csv_buffer = io.StringIO()
            for chunk in df.to_csv(index=False, chunksize=10000):
                csv_buffer.write(chunk)
                yield csv_buffer.getvalue()
                csv_buffer.seek(0)
                csv_buffer.truncate(0)
        data_frames = map(lambda df_json: pd.read_json(df_json), data_frames)

        df_merged = reduce(
            lambda left, right: pd.merge(left, right, on=["timestamp"], how="outer"),
            data_frames,
        ).fillna("void")
        
        # df = pd.read_json(df_json, orient='split')
        csv_buffer = io.StringIO()
        df_merged.to_csv(csv_buffer, index=False)
        

        # zip_buffer = io.BytesIO()
        # with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        #     zip_file.writestr('large_data.csv', csv_buffer.getvalue())
        
        # zip_buffer.seek(0)
        # return zip_buffer.getvalue()
        # print("found data", csv_buffer.getvalue());

        return {'status': 'Task completed!', 'result': csv_buffer.getvalue()}

    # Create a streaming response
    # response = Response(stream_with_context(generate_csv()), mimetype="text/csv")
    # response = Response(csv_buffer, mimetype="text/csv")
    # response.headers.set(
    #     "Content-Disposition", "attachment", filename="large_data.csv"
    # )

    # return response



class Cell_Data(Resource):
    def get(self):
        result = stream_csv.delay(request.args);

        # v_args = get_cell_data.load(request.args)
        # cell_ids = v_args["cellIds"].split(",")
        # for cell_id in cell_ids:
        #     teros_data = pd.DataFrame(
        #         TEROSData.get_teros_data_obj(
        #             cell_id,
        #             resample=v_args["resample"],
        #             start_time=v_args["startTime"],
        #             end_time=v_args["endTime"],
        #         )
        #     )
        #     power_data = pd.DataFrame(
        #         PowerData.get_power_data_obj(
        #             cell_id,
        #             resample=v_args["resample"],
        #             start_time=v_args["startTime"],
        #             end_time=v_args["endTime"],
        #         )
        #     )
        #     sensor_data = pd.DataFrame(
        #         Sensor.get_sensor_data_obj(
        #             name="phytos31",
        #             cell_id=cell_id,
        #             measurement="voltage",
        #             resample=v_args["resample"],
        #             start_time=v_args["startTime"],
        #             end_time=v_args["endTime"],
        #         )
        #     )

        # data_frames = [teros_data.to_json(), power_data.to_json(), sensor_data.to_json()]

        # result = stream_csv.delay(data_frames);
        # result = stream_csv.apply_async(args=[data_frames]);
        return jsonify({"result_id": result.id})

    def post(self):
        pass
