from ..models import db
from user import User


class Cell(db.Model):
    """Table of cells"""

    __tablename__ = "cell"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.Text(), nullable=False, unique=True)
    location = db.Column(db.Text())
    latitude = db.Column(db.Float())
    longitude = db.Column(db.Float())
    #was thinking about using user.get_user(email) to get the user, then use user.id to get the user id but idk how to do that/if that would work in this case
    user_id = db.Column(db.Integer(), db.ForeignKey("user.id"))

    def __repr__(self):
        return repr(self.name)
    
    def add_cell_by_user_email(self, name, location, latitude, longitude, userEmail):
        user_id = User.get_user(userEmail).id
        new_cell = Cell(name=name, location=location, latitude=latitude, longitude=longitude, user_id=user_id)
        new_cell.save()
        return new_cell
    
    @classmethod
    def get_all(cell):
        cell.query.all()

    def save(self):
        db.session.add(self)
        db.session.commit()

## how to set relationship down here
User.db.relationship("User", backref="cell")