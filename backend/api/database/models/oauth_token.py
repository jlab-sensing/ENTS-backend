from ..models import db
from sqlalchemy.dialects.postgresql import UUID
from .user import User


class OAuthToken(db.Model):
    __tablename__ = "oauth_token"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("user.id", ondelete="CASCADE")
    )
    access_token = db.Column(db.String(255), unique=True, nullable=False)
    refresh_token = db.Column(db.String(255), index=True)
    user = db.relationship("User")

    def save(self):
        db.session.add(self)
        db.session.commit()
