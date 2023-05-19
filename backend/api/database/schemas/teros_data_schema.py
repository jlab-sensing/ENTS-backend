from ..schemas import *
from ..models.teros_data import TEROSData


class TEROSDataSchema(ma.SQLAlchemySchema):
    class Meta:
        model = TEROSData
