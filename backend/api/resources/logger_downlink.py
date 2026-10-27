import base64
import binascii

import requests
from flask import request
from flask_restful import Resource

from ..auth.auth import authenticate_apikey_or_jwt
from ..models.logger import Logger as LoggerModel
from ..ttn.end_devices import EndDevice, TTNApi

class LoggerDownlink(Resource):
    method_decorators = { 
        "post": [authenticate_apikey_or_jwt],
    }
    ttn_api = TTNApi()

    def post(self, user, logger_id):
        logger = LoggerModel.get(logger_id)
        if logger is None:
            return {'message': 'Logger not found'}, 404
        
        if (logger.type or "").lower() != "ents":
            return {'message': 'Logger does not support downlinks'}, 400

        if not request.is_json:
            return {'message': "content must be json"}, 415
        
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return {'message': 'request body must be JSON object'}, 400
        
        payload=data.get("payload")
        if not isinstance(payload, str) or not payload:
            return {'message': 'payload mst be a nonempty string'}, 400

        try:
            base64.b64decode(payload, validate=True)
        except (binascii.Error, ValueError):
            return {'message': 'payload must be valid base64'}, 400
        
        f_port = data.get('f_port')
        if (
            isinstance(f_port, bool)
            or not isinstance(f_port, int)
            or not 1 <= f_port <= 223
        ):
            return {'message': 'f_port must be an int from 1 to 223'}, 400

        end_device = EndDevice({
            'ids': {'device_id': f'dirtviz-{logger.id}'},
        })

        try:
            queued = self.ttn_api.send_downlink(
                end_device=end_device,
                payload=payload,
                f_port=f_port,
            )
        except requests.Timeout:
            return {
                'message': 'TTN request timed out'
            }, 504
        except requests.RequestException:
            return {'message': 'TTN request failed'}, 502

        if not queued:
            return {'message': 'TTN rejected downlink'}, 502
        
        return {
            "logger_id": logger.id,
            "status": 'queued',
            "f_port": f_port,
        }, 202