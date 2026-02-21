from celery.result import AsyncResult
from flask_restful import Resource
from ..rate_limit import rate_limit


class Status(Resource):
    @rate_limit("poll")
    def get(self, id: str) -> dict[str, object]:
        task = AsyncResult(id)
        if task.state == "FAILURE":
            return {"state": task.state, "status": task.result}, 500
        elif task.state == "SUCCESS":
            return {"state": task.state, "status": task.result}, 200
        elif task.state == "PENDING":
            return {"state": str(task.state), "status": "Pending..."}, 200
