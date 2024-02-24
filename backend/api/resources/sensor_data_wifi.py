"""Sensor endpoint for requests directly uploading data

The measurement data is POSTed to this resource as protobuf encoded binary data
which is decoded into a dictionary containing measured values. The data is
inserted into the appropriate table in the database. A HTTP response is sent
back containing protobuf binary data with the response message indicating status
of data.

Author: John Madden <jmadden173@pm.me>
"""

from flask import request
from flask_restful import Resource

from .util import process_measurement


class Measurement_Direct(Resource):
    def post(self):
        """Handles POST request containing binary data and return response

        The HTTP request is checked for appropriate Content-Type then the
        measurement is decoded and inserted into the database. Both a HTTP and
        binary response are returned.
        
        Returns:
            Response indicating success or failure. See util.process_measurement
            for full description.
        """
       
        content_type = request.headers.get("Content-Type") 
        
        # check for correct content type and get json
        if content_type == "application/octet-stream":
            # get uplink json 
            data = request.data
        else:
            raise ValueError("POST request must be application/json")
       
        # decode and insret into db 
        resp = process_measurement(data)
        
        return resp