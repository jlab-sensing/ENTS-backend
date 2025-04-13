from flask_restful import Resource
from flask import request
from ..models.user import User
from ..auth.auth import authenticate
from ..schemas.user_data_schema import UserDataSchema

user_schema = UserDataSchema(only=(["email", "first_name", "last_name"]))


class User_Data(Resource):
    method_decorators = [authenticate]

    def get(self, user):
        try:
            user = User.get_user(user.id)
            return user_schema.dump(user)
        except Exception as e:
            return {"message": str(e)}, 500

    def put(self, user):
        try:
            json_data = request.get_json()
            if not json_data:
                return {"message": "No input data provided"}, 400

            user = User.get_user(user.id)
            if not user:
                return {"message": "User not found"}, 404

            if "first_name" in json_data:
                user.first_name = json_data["first_name"]
            if "last_name" in json_data:
                user.last_name = json_data["last_name"]

            user.save()
            return user_schema.dump(user), 200
        except Exception as e:
            return {"message": str(e)}, 500
