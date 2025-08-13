from ..schemas import ma


class AddCellSchema(ma.SQLAlchemySchema):
    """validates cell data"""

    name = ma.String()
    location = ma.String()
    longitude = ma.Float()
    latitude = ma.Float()
    userEmail = ma.Email(dump_default="")
    archive = ma.Boolean(dump_default=False)
    tag_ids = ma.List(ma.Integer(), dump_default=[])
