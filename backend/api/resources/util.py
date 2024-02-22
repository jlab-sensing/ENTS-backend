"""Utility file for database operations

author: John Madden <jmadden173@pm.me>
"""

from datetime import datetime

from soil_power_sensor_protobuf import decode_measurement

from ..database.schemas.power_data_schema import PowerDataSchema
from ..database.schemas.get_cell_data_schema import TEROSDataSchema
from ..database.models.power_data import PowerData
from ..database.models.teros_data import TEROSData


def process_measurement(data : bytes):
    """Process protobuf encoded measurement
   
    The byte string gets decoded through protobuf and inserted into the associated table.
    
    Args
        data: Encoded measurement message
        
    Returns:
        JSON representation of the object inserted into the database
        
    Raises:
        NotImplementedError when the processing of the message type is not
        implemented
    """
    
    # decode binary protobuf data 
    meas = decode_measurement(data)
    
    # stores the json formatted repsonse 
    data_json = None
    
    # power measurement 
    if meas["type"] == "power":
        power_data = PowerData.add_protobuf_power_data(
            meas["loggerId"],
            meas["cellId"],
            datetime.fromtimestamp(meas["ts"]),
            meas["data"]["voltage"],
            meas["data"]["current"],
            ) 
        
        if power_data is not None:
            power_schema = PowerDataSchema()
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
        
        if teros_data is not None:
            teros_schema = TEROSDataSchema()
            data_json = teros_schema.jsonify(teros_data)
    
    # raise error if any other data types are not stored
    else:
        raise NotImplementedError(f"Message type {meas["type"]} not implemented")
    
    return data_json