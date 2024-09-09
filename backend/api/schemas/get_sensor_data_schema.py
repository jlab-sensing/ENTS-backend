from . import ma


class GetSensorDataSchema(ma.SQLAlchemySchema):
    """validates get request for sensor data"""

    cellId = ma.Int()
    name = ma.String()
    measurement = ma.String()
    startTime = ma.DateTime("rfc", required=False)
    endTime = ma.DateTime("rfc", required=False)
    stream = ma.Bool(required=False)
