from ..schemas import ma
from ..models.user import User
from marshmallow import validate


class UserSchema(ma.SQLAlchemyAutoSchema):
    """Schema for serializing Tag objects"""

    cell_count = ma.Method("get_cell_count")

    class Meta:
        model = User
        load_instance = True
        exclude = ["cells"]  # Exclude cells relationship to avoid circular references

    def get_cell_count(self, obj):
        """Get the number of cells associated with this tag"""
        return obj.get_cell_count()

class TagListSchema(ma.Schema):
    """Schema for tag list responses with additional metadata"""

    id = ma.Integer()
    name = ma.String()
    description = ma.String()
    created_at = ma.DateTime()
    created_by = ma.UUID()
    cell_count = ma.Integer()
