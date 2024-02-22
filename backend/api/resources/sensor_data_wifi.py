"""Sensor endpoint for requests directly uploading data

The measurement data is POSTed to this resource as protobuf encoded binary data
which is decoded into a dictionary containing measured values. The data is
inserted into the appropriate table in the database. A HTTP response is sent
back containing protobuf binary data with the response message indicating status
of data.

Author: John Madden <jmadden173@pm.me>
"""

from flask import request, Response
from flask_restful import Resource

from soil_power_sensor_protobuf import encode_response

from .util import process_measurement


class Measurement_Direct(Resource):
    def post(self):
        """Handles POST request containing binary data and return response

        The HTTP request is checked for appropriate Content-Type then the
        measurement is decoded and inserted into the database. Both a HTTP and
        binary response are returned.
        
        Returns:
            Response object with a binary response message indicating a success
            or failure of processing with Content-Type of
            application/octet-stream. An HTTP status code of 201 indicates a
            successful processing and 500 indicates a failure.
        
        Raises:
            ValueError if the header Content-Type is not
            application/octet-stream 
        """
       
        content_type = request.headers.get("Content-Type") 
        
        # check for correct content type and get json
        if content_type == "application/json":
            # get uplink json 
            data = request.data
        else:
            raise ValueError("POST request must be application/json")
       
        # decode and insret into db 
        data_json = process_measurement(data)
        
       
        # format HTTP response 
        resp = Response() 

        # encode response data
        if data_json is not None:
            resp.data = encode_response(True)
            # created
            resp.status_code = 201
        else:
            resp.data = encode_response(False)
            # internal server error
            resp.status_code = 500
        
        resp.content_type = "application/octet-stream"
        # should be autopopulated with automatically_set_content_length
        #resp.content_length = len(resp.data) 
        
        # return json of measurement
        return data_json