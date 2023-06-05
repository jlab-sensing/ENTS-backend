from ..schemas import *
from ..models.power_data import PowerData


class PowerDataSchema(ma.SQLAlchemyAutoSchema):
    """validates power"""
    class Meta:
        model = PowerData
