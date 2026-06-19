from . import ma


class GetSensorDataSchema(ma.SQLAlchemySchema):
    """validates get request for sensor data"""

    cellId = ma.Int()
    name = ma.String()
    measurement = ma.String()
    resample = ma.String(required=False)
    startTime = ma.DateTime("iso", required=False)
    endTime = ma.DateTime("iso", required=False)
    stream = ma.Bool(required=False)
