from ..schemas import ma


class AddCellSchema(ma.SQLAlchemySchema):
    """validates cell data"""

    name = ma.String()
    location = ma.String()
    longitude = ma.Float()
    latitude = ma.Float()
    userEmail = ma.Email()
