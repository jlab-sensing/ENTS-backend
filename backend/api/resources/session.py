from flask import session
from flask_restful import Resource
from ..rate_limit import rate_limit


class Session_r(Resource):
    @rate_limit("auth_general")
    def get(self):
        user_session = session.get("user")
        if not user_session:
            return {"message": "Unauthorized"}, 401
        return {"user": user_session}
