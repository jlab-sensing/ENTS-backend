from ..models import *
from sqlalchemy.dialects.postgresql import MACADDR


class Logger(db.Model):
    """Table of logging hardware"""

    __tablename__ = "logger"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.Text(), nullable=False, unique=True)
    mac = db.Column(MACADDR)
    hostname = db.Column(db.Text())

    def __repr__(self):
        return repr(self.name)

    @classmethod
    def get_all(cell):
        cell.query.all()

    def save(self):
        db.session.add(self)
        db.session.commit()
