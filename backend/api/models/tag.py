from ..models import db
from .user import User

class Tag(db.Model):
    """Table of Tags"""

    __tablename__ = "tag"

    id = db.Columnb(db.Integer, primary_key = True)
    name = db.Column(db.Text(), nullable = False, unique = True)

    cells = db.relationship("Cell", secondary = "Cell_Tag", back_populates="tags")

    def __init__(self, name):
        self.name = name

    def __repr__(self):
        return repr(self.name)