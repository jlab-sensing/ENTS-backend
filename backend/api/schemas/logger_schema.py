from ..schemas import ma
from ..models.logger import Logger


class LoggerSchema(ma.SQLAlchemyAutoSchema):
    """Schema for logger GET responses - excludes UUID field"""

    class Meta:
        model = Logger
        exclude = ("uuid",)