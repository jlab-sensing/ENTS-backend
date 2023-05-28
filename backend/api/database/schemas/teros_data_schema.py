from ..schemas import *
from ..models.teros_data import TEROSData


class TEROSDataSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = TEROSData
