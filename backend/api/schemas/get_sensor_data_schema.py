from . import ma


class GetSensorDataSchema(ma.SQLAlchemySchema):
    """validates get request for sensor data"""

    cellId = ma.Int(required=False)
    cellIds = ma.String(required=False, load_default=None)
    name = ma.String()
    measurement = ma.String()
    resample = ma.String(required=False)
    startTime = ma.DateTime("rfc", required=False)
    endTime = ma.DateTime("rfc", required=False)
    stream = ma.Bool(required=False)
