from ..schemas import *
from ..models.cell import Cell


class CellSchema(ma.SQLAlchemyAutoSchema):
    """validates cell"""
    class Meta:
        model = Cell
