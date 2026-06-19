from celery.result import AsyncResult
from flask_restful import Resource


class Status(Resource):
    def get(self, id: str) -> dict[str, object]:
        task = AsyncResult(id)
        if task.state == "FAILURE":
            # Properly serialize the error for frontend consumption
            error_msg = str(task.result)
            # Extract validation errors if present
            if hasattr(task.result, "messages"):
                error_msg = str(task.result.messages)
            return {"state": task.state, "status": error_msg, "error": True}, 500
        elif task.state == "SUCCESS":
            return {"state": task.state, "status": task.result, "error": False}, 200
        elif task.state == "PENDING":
            return {"state": task.state, "status": "Pending...", "error": False}, 200
        else:
            # Handle other states like STARTED, RETRY, REVOKED
            return {"state": task.state, "status": f"Task is {task.state}", "error": False}, 200
