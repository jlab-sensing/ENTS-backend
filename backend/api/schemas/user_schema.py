from ..schemas import ma
from ..models.user import User
from marshmallow import validate


class UserSchema(ma.SQLAlchemyAutoSchema):
    """Schema for serializing User objects"""

    class Meta:
        model = User
        load_instance = True
        exclude = ["cells", "password"]  # Exclude cells relationship and password


class TagListSchema(ma.Schema):
    """Schema for tag list responses with additional metadata"""

    id = ma.Integer()
    name = ma.String()
    description = ma.String()
    created_at = ma.DateTime()
    created_by = ma.UUID()
    cell_count = ma.Integer()
