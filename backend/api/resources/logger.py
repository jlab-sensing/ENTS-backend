import warnings

from flask import request
from flask_restful import Resource

from ..ttn.end_devices import TTNApi, EntsEndDevice, EndDevice


class Logger(Resource):
    ttn_api = TTNApi()

    def get(self, logger_id: int | None = None):
        """Get a logger or all loggers.

        When getting data from all loggers, only data from the table is
        returned. When getting a specific logger, it checks the type of logger
        and retrieves the additional information.

        Args:
            logger_id: The ID of the logger to retrieve. If None, retrieves all
            loggers.

        Returns:
            A dictionary with logger data or a message indicating the endpoint
            is active.
        """

        # TODO: Get logger by ID or all loggers if ID is None
        if logger_id is None:
            # Get all logger from the database
            pass

        else:
            # TODO: Check the type of logger
            _type = "ents"

            if _type == "ents":
                ed = EndDevice(
                    {
                        "ids": {"device_id": f"dirtviz-{logger_id}"},
                    }
                )

                ed = self.ttn_api.get_end_device(ed)
                if ed is None:
                    return {"message": "End device not found"}, 404

                return ed.data, 200

            # TODO: Get info from the database

        return {"message": "Logger endpoint is active"}, 200

    def post(self):
        """Creates a new logger

        Expected JSON payload:
        {
            "type": "ents",
            "name": "Logger Name",
            "dev_eui": "0080E1150546D093",
            "join_eui": "0101010101010101",
            "app_key": "CEC24E6A258B2B20A5A7C05ABD2C1724"
        }
        """

        json_data = request.json

        _type = json_data["type"]

        # TODO: Create logger entry in table
        # placeholder for logger_id
        logger_id = 0

        if _type == "ents":
            ed = EntsEndDevice(
                name=json_data["name"],
                device_id=f"dirtviz-{logger_id}",
                dev_eui=json_data["dev_eui"],
                join_eui=json_data["join_eui"],
                app_key=json_data["app_key"],
            )

            ed = self.ttn_api.register_end_device(ed)
            if ed is None:
                return {"message": "Failed to register end device with TTN"}, 400

        else:
            warnings.warn(
                f"Unknown end device type '{_type}', not settings any default values."
            )

        return ed.data, 201

    def put(self, logger_id: int):
        """Update a logger.

        See database for supported field.

        {
            "type": "ents",
            "name": "Logger Name",
            "Descriptions": "...",
            ...
        }

        Args:
            logger_id: The ID of the logger to delete.
        """

        # TODO: Check the type of logger
        _type = "ents"

        ed = EndDevice(  # noqa: F841
            {
                "ids": {"device_id": f"dirtviz-{logger_id}"},
            }
        )

        # Here you would handle updating a log entry
        return "", 200

    def delete(self, logger_id: int):
        """Delete a logger.

        Checks the type of logger and deletes it accordingly. For ENTS it
        removes the end device from The Things Network (TTN) registry.

        Args:
            logger_id: The ID of the logger to delete.
        """

        # TODO: Check the type of logger
        _type = "ents"

        if _type == "ents":
            ed = EndDevice(
                {
                    "ids": {"device_id": f"dirtviz-{logger_id}"},
                }
            )

            TTNApi.delete_end_device(ed)

        # TODO: Implement deletion from the logger table

        return "", 200
