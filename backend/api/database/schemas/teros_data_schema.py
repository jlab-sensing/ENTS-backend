from ..schemas import ma
from ..models.teros_data import TEROSData


class TEROSDataSchema(ma.SQLAlchemyAutoSchema):
    """validates teros"""

    class Meta:
        model = TEROSData
