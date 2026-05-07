from .. import ma
from ..models.sensor import Sensor

class SensorSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Sensor
    
    id = ma.Integer()
    cell_id = ma.Integer()
    measurement = ma.String()
    data_type = ma.String()
    unit = ma.String()
    name = ma.String()