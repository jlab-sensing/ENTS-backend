from celery.result import AsyncResult
from flask_restful import Resource
from flask import Response, stream_with_context, jsonify
import pandas as pd
import io

class Status(Resource):
  def get(self, id: str) -> dict[str, object]:
    result = AsyncResult(id)
    # print(result.result, flush=True)
    # df = pd.read_json(result.result, orient='split')

    if result.ready and result.successful:
        response = Response(result.result, mimetype="text/csv")
        # print(result.result);
        response.headers.set(
            "Content-Disposition", "attachment", filename="large_data.csv"
        )
        return response
    elif result.ready and not result.successful:
        return jsonify({"msg", "ERROR: worker failed"}), 500
    else:
        return jsonify({"msg", "IN PROGRESS"}), 102 
    # def generate_csv():
    #     csv_buffer = io.StringIO()
    #     for chunk in df.to_csv(index=False, chunksize=10000):
    #         csv_buffer.write(chunk)
    #         yield csv_buffer.getvalue()
    #         csv_buffer.seek(0)
    #         csv_buffer.truncate(0)

    # # Create a streaming response
    # response = Response(stream_with_context(generate_csv()), mimetype="text/csv")
    # response.headers.set(
    #     "Content-Disposition", "attachment", filename="large_data.csv"
    # )

    return response

    # return result
    # return {
    #     "ready": result.ready(),
    #     "successful": result.successful(),
    #     "value": result.result if result.ready() else None,
    # }