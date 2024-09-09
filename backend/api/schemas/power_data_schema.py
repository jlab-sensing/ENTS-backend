from ..schemas import ma
from ..models.power_data import PowerData


class PowerDataSchema(ma.SQLAlchemyAutoSchema):
    """validates power"""

    class Meta:
        model = PowerData
