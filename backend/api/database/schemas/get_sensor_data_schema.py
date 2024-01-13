from . import ma


class GetSensorDataSchema(ma.SQLAlchemySchema):
    """validates get request for sensor data"""

    startTime = ma.DateTime(required=False)
    endTime = ma.DateTime(required=False)
