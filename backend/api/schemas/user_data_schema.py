from ..schemas import ma
from ..models.user import User


class UserDataSchema(ma.SQLAlchemyAutoSchema):
    """validates user data"""

    class Meta:
        model = User
