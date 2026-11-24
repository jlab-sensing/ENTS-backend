from ..schemas import ma
from ..models.cell import Cell


class CellSchema(ma.SQLAlchemyAutoSchema):
    """Schema for serializing Cell objects"""

    metadata = ma.Dict(attribute="cell_metadata")

    class Meta:
        model = Cell
        load_instance = True
        exclude = [
            "tags",
            "cell_metadata",
        ]  # Exclude tags and internal cell_metadata attribute
