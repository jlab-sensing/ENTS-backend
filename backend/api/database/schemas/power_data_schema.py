from ... import ma
from ..models.power_data import PowerData


class PowerDataSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = PowerData
