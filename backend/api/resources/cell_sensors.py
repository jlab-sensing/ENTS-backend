from flask_restful import Resource
from ..models.sensor import Sensor
from ..schemas.sensor_schema import SensorSchema

sensor_schema = SensorSchema(many=True)


class Cell_Sensors(Resource):
    def get(self, cell_id):
        sensors = Sensor.query.filter_by(cell_id=cell_id).all()
        return sensor_schema.dump(sensors)
