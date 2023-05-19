from ..schemas import *
from ..models.cell import Cell


class CellSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Cell
