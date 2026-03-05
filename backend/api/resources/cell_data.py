from flask import request, jsonify
from flask_restful import Resource
import pandas as pd
from ..schemas.get_cell_data_schema import GetCellDataSchema
from io import StringIO
from celery import shared_task

get_cell_data = GetCellDataSchema()


@shared_task(bind=True, ignore_result=False)
def stream_csv(self, request_args):
    """Creates a task that queries cell data and writes into buffer

    jmadden173: Temperarily converted this to a blank download.

    Arguments:
    request_args -- arguments of the request being made
    """

    csv_buffer = StringIO()

    df = pd.DataFrame()

    df.to_csv(csv_buffer, index=False)

    return csv_buffer.getvalue()


class Cell_Data(Resource):
    def get(self):
        result = stream_csv.delay(request.args)
        return jsonify({"result_id": result.id})

    def post(self):
        pass
