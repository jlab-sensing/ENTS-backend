from flask_restful import Resource
from ..database.models.user import User
from ..database.schemas.user_data_schema import UserDataSchema
from ..auth.auth import authenticate

user_schema = UserDataSchema(only=(["email"]))


class User_Data(Resource):
    method_decorators = [authenticate]

    def get(self, user):
        return user_schema.dump(User.get_user(user.id))
