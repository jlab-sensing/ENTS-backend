from flask_restful import Resource
from flask import request
from ..auth.auth import authenticate
from ..schemas.logger_schema import LoggerSchema
from ..models.logger import Logger as LoggerModel
from ..schemas.add_logger_schema import AddLoggerSchema

loggers_schema = LoggerSchema(many=True)
add_logger_schema = AddLoggerSchema()


class Logger(Resource):
    method_decorators = {"get": [authenticate]}

    def get(self, user):
        json_data = request.args
        userLoggers = json_data.get("user")

        if userLoggers:
            loggers = LoggerModel.get_loggers_by_user_id(user.id)
            return loggers_schema.dump(loggers)
        else:
            loggers = LoggerModel.get_all()
            return loggers_schema.dump(loggers)

    def post(self):
        json_data = request.json
        logger_data = add_logger_schema.load(json_data)
        logger_name = logger_data["name"]
        type = logger_data.get("type", "")
        device_eui = logger_data.get("device_eui", "")
        description = logger_data.get("description", "")
        userEmail = logger_data["userEmail"]
        
        if LoggerModel.find_by_name(logger_name):
            return {"message": "Duplicate logger name"}, 400
        
        new_logger = LoggerModel.add_logger_by_user_email(
            logger_name, type, device_eui, description, userEmail
        )
        if new_logger:
            return {"message": "Successfully added logger"}
        return {"message": "Error adding logger"}, 400

    def put(self, loggerId):
        json_data = request.json
        logger = LoggerModel.get(loggerId)

        if logger:
            if "name" in json_data:
                logger.name = json_data.get("name")
            if "type" in json_data:
                logger.type = json_data.get("type")
            if "device_eui" in json_data:
                logger.device_eui = json_data.get("device_eui")
            if "description" in json_data:
                logger.description = json_data.get("description")

            logger.save()
            return {"message": "Successfully updated logger"}
        return {"message": "Logger not found"}, 404

    def delete(self, loggerId):
        logger = LoggerModel.get(loggerId)
        if not logger:
            return {"message": "Logger not found"}, 404
        logger.delete()

        return {"message": "Logger deleted successfully"}