from flask_restful import Resource
from ..models.user import User
from ..auth.auth import authenticate
from ..schemas.user_data_schema import UserDataSchema

user_schema = UserDataSchema(only=(["email", "first_name", "last_name"]))


class User_Data(Resource):
    method_decorators = [authenticate]

    def get(self, user):
        user = User.get_user(user.id)
        return user_schema.dump(user)
