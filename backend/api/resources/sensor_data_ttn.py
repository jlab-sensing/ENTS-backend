"""Sensor endpoint for request made with The Things Network webhooks

The api endpoint handles uplink messages from The Things Network (TNN). The data
payload is decoded and inserted into the database. See the following for more
information on TTN integration:
- https://www.thethingsindustries.com/docs/integrations/webhooks/creating-webhooks/.
- https://www.thethingsindustries.com/docs/the-things-stack/concepts/data-formats/.

TODO:
- Integrate downlinks to device to ack the data as successfully inserted into
the db and data can be cleared from local non-volatile storage. See
https://www.thethingsindustries.com/docs/integrations/webhooks/scheduling-downlinks/

Author: John Madden <jmadden173@pm.me>
"""

from flask import request, jsonify
from flask_restful import Resource
from ..database.schemas.power_data_schema import PowerDataSchema
from ..database.schemas.get_cell_data_schema import TEROSDataSchema
from ..database.schemas.p_input import PInput
from ..database.models.power_data import PowerData
from ..database.models.teros_data import TEROSData

from datetime import datetime

from soil_power_sensor_protobuf import decode_measurement

power_schema = PowerDataSchema()
teros_schema = TEROSDataSchema()

class Measurement_Upink(Resource):
    def post(self):
        """Handlings uplink POST request from TTN"""

        # get uplink json 
        uplink_json = request.json
       
        # get payload 
        payload = uplink_json["uplink_message"]["frm_payload"]
       
        # decode binary protobuf data 
        meas = decode_measurement(payload)
       
        # power measurement 
        if meas["type"] == "power":
            power_data = PowerData.add_protobuf_power_data(
                meas["loggerId"],
                meas["cellId"],
                datetime.fromtimestamp(meas["ts"]),
                meas["data"]["voltage"],
                meas["data"]["current"],
                ) 
            
            data_json = power_schema.jsonify(power_data)
        
        # teros12 measurement 
        elif meas["type"] == "teros12":
            teros_data = TEROSData.add_protobuf_teros_data(
                meas["cellId"],
                datetime.fromtimestamp(meas["ts"]),
                meas["data"]["vwcAdj"],
                meas["data"]["vwcRaw"],
                meas["data"]["temp"],
                meas["data"]["ec"],
                None,
            )
            
            data_json = teros_schema.jsonify(teros_data)
        
        # raise error if any other data types are not stored
        else:
            raise NotImplementedError(f"Message type {meas["type"]} not implemented")
        
        # TODO: Add downlink messages to device 
        
        # return json of measurement
        return data_json