from ..models import db
from uuid import uuid4


def get_uuid():
    """generate random number"""
    return uuid4().hex


class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.String(32), primary_key=True, unique=True, default=get_uuid)
    email = db.Column(db.String(345), unique=True)
    password = db.Column(db.String(72), nullable=False)

    def get_user_id(self):
        return self.id
