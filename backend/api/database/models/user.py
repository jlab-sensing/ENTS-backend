from ..models import db
from sqlalchemy.dialects.postgresql import UUID
import uuid


class User(db.Model):
    __tablename__ = "user"

    id = db.Column(
        UUID(as_uuid=True), primary_key=True, unique=True, default=uuid.uuid4
    )
    email: str = db.Column(db.String(345), unique=True)
    password = db.Column(db.String(72), nullable=False)

    def set_refresh_token(self, refresh_token):
        self.refresh_token = refresh_token

    @staticmethod
    def get_user(id):
        return User.query.filter_by(id=id).first()
