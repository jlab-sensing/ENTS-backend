from ..schemas import ma
from ..models.cell import Cell


class CellSchema(ma.SQLAlchemyAutoSchema):
    """validates cell"""

    class Meta:
        model = Cell
