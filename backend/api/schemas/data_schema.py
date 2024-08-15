from ..schemas import ma
from ..models.data import Data


class DataSchema(ma.SQLAlchemyAutoSchema):
    """validates data"""

    class Meta:
        model = Data
