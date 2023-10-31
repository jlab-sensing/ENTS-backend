from flask import session
from flask_restful import Resource


class Session_r(Resource):
    def get(self):
        user_session = session.get("user")
        if not user_session:
            return {"message": "Unauthorized"}, 401
        return {"user": user_session}
