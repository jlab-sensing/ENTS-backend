import secrets
from flask_restful import Resource

from ..auth.auth import authenticate
from ..models import db
from ..models.user import User


class ApiKey(Resource):
    method_decorators = {
        "get": [authenticate],
        "post": [authenticate],
        "delete": [authenticate],
    }

    def get(self, user):
        return {"api_key": user.api_key}, 200

    def post(self, user):
        if user.api_key is not None:
            return {
                "message": (
                    "API key already exists. Delete existing key"
                    " before creating a new one."
                )
            }, 409
        api_key = secrets.token_hex(32)
        while User.query.filter_by(api_key=api_key).first() is not None:
            api_key = secrets.token_hex(32)

        user.api_key = api_key
        db.session.commit()
        return {"api_key": api_key}, 201

    def delete(self, user):
        user.api_key = None
        db.session.commit()
        return {"message": "API key deleted"}, 200
