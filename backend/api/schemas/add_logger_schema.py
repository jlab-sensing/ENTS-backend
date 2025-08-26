from ..schemas import ma


class AddLoggerSchema(ma.SQLAlchemySchema):
    """Schema for validating logger creation data"""

    name = ma.String(required=True)
    type = ma.String()
    device_eui = ma.String()
    description = ma.String()
    userEmail = ma.Email(required=True, dump_default="")
