from celery.result import AsyncResult
from flask_restful import Resource
from flask import Response, stream_with_context, jsonify
import pandas as pd
import io


class Status(Resource):
    def get(self, id: str) -> dict[str, object]:
        task = AsyncResult(id)
        print("id: ", id, flush=True)
        # print(result.result, flush=True)
        # df = pd.read_json(result.result, orient='split')

        if task.state == "FAILURE":
            return {"state": task.state, "status": task.result}, 500
        elif task.state == "SUCCESS":
            # response = Response(task.result, mimetype="text/csv")
            # response.headers.set(
            #     "Content-Disposition", "attachment", filename="large_data.csv"
            # )
            # return response
            return {"state": task.state, "status": task.result}, 200
        elif task.state == "PENDING":
            return {"state": str(task.state), "status": "Pending..."}, 200
        # else:
        #     print("errored out", task.result, flush=True)
        #     return {"state": task.state, "status": task.result}, 500

        # if result.ready and result.successful:
        #     response = Response(result.result, mimetype="text/csv")
        #     print("done", result.result, flush=True)
        #     # if 'result' in result.info:
        #     #     print("done", result.info['result'], flush=True);
        #         # response['result'] = task.info['result']

        #     response.headers.set(
        #         "Content-Disposition", "attachment", filename="large_data.csv"
        #     )
        #     return response
        # elif result.ready and not result.successful:
        #     return jsonify({"msg", "ERROR: worker failed"}), 500
        # else:
        #     return jsonify({"msg", "IN PROGRESS"}), 102

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

        # return response
        # return {"test": "hi"}

        # return result
        # return {
        #     "ready": result.ready(),
        #     "successful": result.successful(),
        #     "value": result.result if result.ready() else None,
        # }
