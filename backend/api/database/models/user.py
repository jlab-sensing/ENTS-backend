from ..models import db
from sqlalchemy.dialects.postgresql import UUID
from .oauth_token import OAuthToken
import uuid


class User(db.Model):
    __tablename__ = "user"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name: str = db.Column(db.String(255))
    last_name: str = db.Column(db.String(255))
    email: str = db.Column(db.String(255), unique=True)
    password: str = db.Column(db.String(72), nullable=False)

    def set_refresh_token(self, refresh_token):
        token = OAuthToken.query.filter(OAuthToken.user_id == self.id).first()
        if not token:
            token = OAuthToken(
                user_id=self.id, access_token="", refresh_token=refresh_token
            )
            token.save()
        else:
            token.refresh_token = refresh_token
            db.session.commit()

    def clear_refresh_token(self):
        token = OAuthToken.query.filter(OAuthToken.user_id == self.id).first()
        if token:
            token.delete()

    @staticmethod
    def get_user(id):
        return User.query.filter_by(id=id).first()
