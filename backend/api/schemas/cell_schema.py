from ..schemas import ma
from ..models.cell import Cell


class CellSchema(ma.SQLAlchemyAutoSchema):
    """Schema for serializing Cell objects"""
    
    class Meta:
        model = Cell
        load_instance = True
        exclude = ['tags']  # Exclude tags relationship to avoid circular reference
