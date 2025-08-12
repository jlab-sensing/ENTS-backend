from ..schemas import ma
from ..models.cell import Tag
from marshmallow import validate


class TagSchema(ma.SQLAlchemyAutoSchema):
    """Schema for serializing Tag objects"""
    
    cell_count = ma.Method("get_cell_count")
    
    class Meta:
        model = Tag
        load_instance = True
        exclude = ['cells']  # Exclude cells relationship to avoid circular references

    def get_cell_count(self, obj):
        """Get the number of cells associated with this tag"""
        return obj.get_cell_count()


class CreateTagSchema(ma.Schema):
    """Schema for validating tag creation data"""
    
    name = ma.String(required=True, validate=validate.Length(min=1, max=255))
    description = ma.String(allow_none=True)


class UpdateTagSchema(ma.Schema):
    """Schema for validating tag update data"""
    
    name = ma.String(validate=validate.Length(min=1, max=255))
    description = ma.String(allow_none=True)


class TagListSchema(ma.Schema):
    """Schema for tag list responses with additional metadata"""
    
    id = ma.Integer()
    name = ma.String()
    description = ma.String()
    created_at = ma.DateTime()
    created_by = ma.UUID()
    cell_count = ma.Integer()