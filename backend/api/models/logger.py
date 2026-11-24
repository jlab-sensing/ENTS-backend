from ..models import db
from .user import User
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import func, or_
from datetime import datetime
import uuid


class Logger_User(db.Model):
    """Users a logger is shared with; the owner is Logger.user_id"""

    __tablename__ = "logger_user"
    logger_id = db.Column(db.Integer, db.ForeignKey("logger.id"), primary_key=True)
    user_id = db.Column(db.Uuid(), db.ForeignKey("user.id"), primary_key=True)


class Logger(db.Model):
    """Table of logging hardware"""

    __tablename__ = "logger"

    id = db.Column(db.Integer, primary_key=True)
    uuid = db.Column(UUID(), nullable=False, unique=True, default=uuid.uuid4)
    name = db.Column(db.Text(), nullable=False, unique=True)
    type = db.Column(db.Text())
    device_eui = db.Column(db.Text())
    description = db.Column(db.Text())
    date_created = db.Column(db.DateTime(), nullable=False, default=datetime.utcnow)
    user_id = db.Column(UUID(), db.ForeignKey("user.id"))

    user = db.relationship("User", backref="loggers")
    shared_users = db.relationship("User", secondary=Logger_User.__table__)

    def __init__(self, name, type="", device_eui="", description="", user_id=None):
        self.name = name
        self.type = type
        self.device_eui = device_eui
        self.description = description
        self.user_id = user_id

    def __repr__(self):
        return repr(self.name)

    @staticmethod
    def add_logger_by_user_email(name, type, device_eui, description, userEmail):
        user_id = User.get_user_by_email(userEmail).id
        new_logger = Logger(
            name=name,
            type=type,
            device_eui=device_eui,
            description=description,
            user_id=user_id,
        )
        new_logger.save()
        return new_logger

    @staticmethod
    def get(id):
        return Logger.query.filter_by(id=id).first()

    @staticmethod
    def find_by_name(name):
        return Logger.query.filter_by(name=name).first()

    @staticmethod
    def find_by_device_eui(device_eui):
        normalized = (device_eui or "").strip().upper()
        if not normalized:
            return None

        return Logger.query.filter(
            func.upper(func.trim(Logger.device_eui)) == normalized
        ).first()

    @staticmethod
    def get_loggers_by_user_id(id):
        """Get loggers the user owns or that are shared with them"""
        return Logger.query.filter(
            or_(Logger.user_id == id, Logger.shared_users.any(User.id == id))
        ).all()

    @staticmethod
    def get_all():
        return Logger.query.all()

    def save(self):
        db.session.add(self)
        db.session.commit()

    def delete(self):
        db.session.delete(self)
        db.session.commit()
