import warnings
import re
from flask_restful import Resource
from flask import request
from ..auth.auth import authenticate
from ..schemas.logger_schema import LoggerSchema
from ..models.logger import Logger as LoggerModel
from ..schemas.add_logger_schema import AddLoggerSchema
from ..ttn.end_devices import TTNApi, EntsEndDevice, EndDevice

logger_schema = LoggerSchema()
loggers_schema = LoggerSchema(many=True)
add_logger_schema = AddLoggerSchema()


class Logger(Resource):
    method_decorators = {
        "get": [authenticate],
        "post": [authenticate],
        "put": [authenticate],
        "delete": [authenticate],
    }
    ttn_api = TTNApi()

    def get(self, user, logger_id: int | None = None):
        """Get a logger or all loggers with optional TTN integration.

        When getting data from all loggers, only data from the database is
        returned. When getting a specific logger, it can optionally check TTN
        for additional status information.

        Args:
            user: Authenticated user from decorator
            logger_id: The ID of the logger to retrieve. If None, retrieves all
            user's loggers.

        Returns:
            A dictionary with logger data or list of loggers.
        """
        json_data = request.args
        userLoggers = json_data.get("user")

        if logger_id is None:
            # Get all loggers based on user parameter
            if userLoggers:
                loggers = LoggerModel.get_loggers_by_user_id(user.id)
                return loggers_schema.dump(loggers)
            else:
                loggers = LoggerModel.get_all()
                return loggers_schema.dump(loggers)
        else:
            # Get specific logger with optional TTN info
            logger = LoggerModel.get(logger_id)
            if not logger:
                return {"message": "Logger not found"}, 404

            # Check if this logger has TTN integration (type "ents")
            if logger.type and logger.type.lower() == "ents":
                try:
                    ed = EndDevice({"ids": {"device_id": f"dirtviz-{logger_id}"}})

                    ttn_device = self.ttn_api.get_end_device(ed)
                    if ttn_device:
                        # Return combined database + TTN info
                        logger_data = logger_schema.dump(logger)
                        logger_data["ttn_status"] = ttn_device.data
                        return logger_data, 200
                except Exception as e:
                    warnings.warn(f"Failed to get TTN device info: {str(e)}")

            # Return database info only
            return logger_schema.dump(logger), 200

    def post(self, _user):
        """Creates a new logger with database and TTN registration.

        Expected JSON payload:
        {
            "name": "Logger Name",
            "type": "ents",
            "device_eui": "0080E1150546D093",  # for database
            "dev_eui": "0080E1150546D093",     # for TTN (same as device_eui)
            "join_eui": "0101010101010101",    # for TTN only
            "app_key": "CEC24E6A258B2B20A5A7C05ABD2C1724",  # for TTN only
            "description": "Logger description",
            "userEmail": "user@example.com"
        }
        """
        json_data = request.json

        # Validate required fields
        required_fields = ["name", "userEmail"]
        for field in required_fields:
            if field not in json_data:
                return {"message": f"Missing required field: {field}"}, 400

        # Extract data for database
        logger_name = json_data["name"]
        type_val = json_data.get("type", "")
        device_eui = json_data.get("device_eui", "")
        description = json_data.get("description", "")
        userEmail = json_data["userEmail"]

        # Check for duplicate logger name
        if LoggerModel.find_by_name(logger_name):
            return {"message": "Duplicate logger name"}, 400

        # Create database entry first to get logger_id
        new_logger = LoggerModel.add_logger_by_user_email(
            logger_name, type_val, device_eui, description, userEmail
        )

        if not new_logger:
            return {"message": "Error adding logger to database"}, 400

        # If type is "ents", register with TTN
        if type_val and type_val.lower() == "ents":
            try:
                # Extract TTN-specific fields (not stored in database).
                # LoRaWAN credentials are optional.
                # If missing/invalid, create the logger in the DB and skip TTN
                # registration (supports "wifi only" loggers).
                def _norm_hex(v):
                    return re.sub(r"[^0-9a-fA-F]", "", v or "")

                dev_eui = _norm_hex(json_data.get("dev_eui"))
                join_eui = _norm_hex(json_data.get("join_eui"))
                app_key = _norm_hex(json_data.get("app_key"))

                def _is_valid_eui64(v):
                    return bool(re.fullmatch(r"[0-9a-fA-F]{16}", v or ""))

                def _is_valid_app_key(v):
                    return bool(re.fullmatch(r"[0-9a-fA-F]{32}", v or ""))

                has_all = bool(dev_eui and join_eui and app_key)
                valid_all = (
                    _is_valid_eui64(dev_eui)
                    and _is_valid_eui64(join_eui)
                    and _is_valid_app_key(app_key)
                )

                if not (has_all and valid_all):
                    return {
                        "message": (
                            "Successfully added logger (TTN registration skipped: "
                            "missing or invalid LoRaWAN credentials)"
                        ),
                        "logger_id": new_logger.id,
                        "ttn_registered": False,
                    }, 201

                # Create TTN end device
                ed = EntsEndDevice(
                    name=logger_name,
                    device_id=f"dirtviz-{new_logger.id}",
                    dev_eui=dev_eui,
                    join_eui=join_eui,
                    app_key=app_key,
                )

                ttn_device = self.ttn_api.register_end_device(ed)
                if not ttn_device:
                    # Rollback database entry if TTN registration fails
                    new_logger.delete()
                    return {"message": "Failed to register end device with TTN"}, 400

                return {
                    "message": "Successfully added logger with TTN registration",
                    "logger_id": new_logger.id,
                    "ttn_device_id": f"dirtviz-{new_logger.id}",
                    "ttn_registered": True,
                }, 201

            except Exception as e:
                # Rollback database entry on TTN error
                warnings.warn(
                    f"TTN registration failed for logger {new_logger.id}: {str(e)}"
                )
                new_logger.delete()
                return {"message": f"TTN registration failed: {str(e)}"}, 400
        else:
            # Non-ents logger, database only
            return {
                "message": "Successfully added logger",
                "logger_id": new_logger.id,
            }, 201

    def put(self, _user, logger_id: int):
        """Update a logger in database and TTN.

        Only name and description can be updated. TTN device name will be
        updated if the logger type is "ents".

        Args:
            logger_id: The ID of the logger to update.
        """
        json_data = request.json
        logger = LoggerModel.get(logger_id)

        if not logger:
            return {"message": "Logger not found"}, 404

        # Update database fields
        updated = False
        if "name" in json_data:
            logger.name = json_data.get("name")
            updated = True
        if "description" in json_data:
            logger.description = json_data.get("description")
            updated = True

        if not updated:
            return {"message": "No valid fields to update"}, 400

        # Save to database
        logger.save()

        # Update TTN if it's an ents device and name was changed
        if logger.type and logger.type.lower() == "ents" and "name" in json_data:
            try:
                ed = EndDevice(
                    {
                        "ids": {"device_id": f"dirtviz-{logger_id}"},
                        "name": json_data["name"],
                    }
                )

                ttn_updated = self.ttn_api.update_end_device(ed)
                if not ttn_updated:
                    warnings.warn(
                        f"Failed to update TTN device name for logger {logger_id}"
                    )

            except Exception as e:
                warnings.warn(f"TTN update failed for logger {logger_id}: {str(e)}")

        return {"message": "Successfully updated logger"}, 200

    def delete(self, _user, logger_id: int):
        """Delete a logger from both TTN and database.

        For ents loggers, removes the end device from TTN first, then deletes
        from database. For other types, only deletes from database.

        Args:
            logger_id: The ID of the logger to delete.
        """
        logger = LoggerModel.get(logger_id)
        if not logger:
            return {"message": "Logger not found"}, 404

        # If it's an ents device, delete from TTN first
        if logger.type and logger.type.lower() == "ents":
            try:
                ed = EndDevice({"ids": {"device_id": f"dirtviz-{logger_id}"}})

                ttn_deleted = self.ttn_api.delete_end_device(ed)
                if not ttn_deleted:
                    warnings.warn(f"Failed to delete TTN device for logger {logger_id}")

            except Exception as e:
                warnings.warn(f"TTN deletion failed for logger {logger_id}: {str(e)}")
                # Continue with database deletion even if TTN fails

        # Delete from database
        logger.delete()
        return {"message": "Logger deleted successfully"}, 200
