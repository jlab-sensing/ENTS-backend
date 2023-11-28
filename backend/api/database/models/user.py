from ..models import db
from uuid import uuid4
from dataclasses import dataclass


def get_uuid():
    """generate random number"""
    return uuid4().hex


@dataclass
class User(db.Model):
    __tablename__ = "user"
    id: int = db.Column(db.String(32), primary_key=True, unique=True, default=get_uuid)
    email: str = db.Column(db.String(345), unique=True)
    password = db.Column(db.String(72), nullable=False)

    def get_user_id(self):
        return self.id
