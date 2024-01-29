from ..schemas import ma
from ..models.user import User


class UserDataSchema(ma.SQLAlchemyAutoSchema):
    """validates teros"""

    class Meta:
        model = User
