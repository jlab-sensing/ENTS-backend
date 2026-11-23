from flask_restful import Resource
from flask import request
from ..auth.auth import authenticate_apikey_or_jwt
from ..models.logger import Logger as LoggerModel
from ..models.user import User as UserModel
from ..schemas.user_schema import UserSchema

user_schema = UserSchema()


class LoggerShare(Resource):
    """Resource for sharing a logger with another user by email"""

    method_decorators = [authenticate_apikey_or_jwt]

    def post(self, authenticated_user, logger_id):
        """Share a logger with a user by their email

        Only the owner or a user the logger is already shared with can share it.
        """
        logger = LoggerModel.get(logger_id)
        if not logger:
            return {"message": "Logger not found"}, 404

        if (
            logger.user_id != authenticated_user.id
            and authenticated_user not in logger.shared_users
        ):
            return {"message": "You do not have access to this logger"}, 403

        json_data = request.json
        if not json_data or "email" not in json_data:
            return {"message": "email is required"}, 400

        email = json_data.get("email")
        if not email:
            return {"message": "email cannot be empty"}, 400

        target_user = UserModel.get_user_by_email(email)
        if not target_user:
            return {"message": f"User with email {email} not found"}, 404

        if target_user.id == logger.user_id or target_user in logger.shared_users:
            return {"message": "User already has access to this logger"}, 400

        logger.shared_users.append(target_user)
        logger.save()

        return {
            "message": "Logger shared successfully",
            "user": user_schema.dump(target_user),
        }
