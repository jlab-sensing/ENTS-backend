from ..models import db
from sqlalchemy.dialects.postgresql import UUID
from .oauth_token import OAuthToken
import uuid


class Cell_User(db.Model):
    __tablename__ = "cell_tag"
    cell_id = db.Column(db.Integer, db.ForeignKey("cell.id"), primary_key=True)
    user_d = db.Column(db.Integer, db.ForeignKey("user.id"), primary_key=True)


class User(db.Model):
    __tablename__ = "user"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name: str = db.Column(db.String(255))
    last_name: str = db.Column(db.String(255))
    email: str = db.Column(db.String(255), unique=True)
    password: str = db.Column(db.String(72), nullable=False)

    def set_token(self, access_token, refresh_token):
        token = OAuthToken.query.filter(OAuthToken.user_id == self.id).first()
        if not token:
            token = OAuthToken(
                user_id=self.id, access_token=access_token, refresh_token=refresh_token
            )
        else:
            token.access_token = access_token
            token.refresh_token = refresh_token
        token.save()

    def clear_refresh_token(self):
        token = OAuthToken.query.filter(OAuthToken.user_id == self.id).first()
        if token:
            token.delete()

    def save(self):
        db.session.add(self)
        db.session.commit()

    @staticmethod
    def get_user(id):
        return User.query.filter_by(id=id).first()

    @staticmethod
    def get_user_by_email(email):
        return User.query.filter_by(email=email).first()
