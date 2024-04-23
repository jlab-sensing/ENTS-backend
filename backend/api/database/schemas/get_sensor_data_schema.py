from . import ma


class GetSensorDataSchema(ma.SQLAlchemySchema):
    """validates get request for sensor data"""

    cellId = ma.Int()
    name = ma.String()
    measurement = ma.String()
    startTime = ma.DateTime(required=False)
    endTime = ma.DateTime(required=False)
