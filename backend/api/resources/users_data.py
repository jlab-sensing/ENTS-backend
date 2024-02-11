from flask_restful import Resource
from ..database.models.user import User
from ..database.schemas.user_data_schema import UserDataSchema
from ..auth.auth import authenticate

user_schema = UserDataSchema(only=(["email", "first_name", "last_name"]))


class User_Data(Resource):
    method_decorators = [authenticate]

    def get(self, user):
        user = User.get_user(user.id)
        return user_schema.dump(user)
