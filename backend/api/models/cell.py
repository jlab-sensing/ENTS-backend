from ..models import db
from .user import User


""""This is the reference; we stole this from commenter
https://stackoverflow.com/questions/5756559/how-to-build-many-to-many-relations-using-sqlalchemy-a-good-example"""


class Cell_Tag(db.Model):
    __tablename__ = "cell_tag"
    cell_id = db.Column(db.Integer, db.ForeignKey("cell.id"), primary_key=True)
    tag_id = db.Column(db.Integer, db.ForeignKey("tag.id"), primary_key=True)


class Cell(db.Model):
    """Table of cells"""

    __tablename__ = "cell"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.Text(), nullable=False, unique=True)
    location = db.Column(db.Text())
    latitude = db.Column(db.Float())
    longitude = db.Column(db.Float())
    archive = db.Column(db.Boolean(), default=False, nullable=False)
    user_id = db.Column(db.Uuid(), db.ForeignKey("user.id"))

    user = db.relationship("User", backref="cell")
    tags = db.relationship("Tag", secondary=Cell_Tag.__table__, backref="cell")

    def __init__(
        self,
        name="",
        location="",
        latitude=37.000786081466266,
        longitude=-122.0631536846593,
        archive=False,
        user_id=None,
    ):
        self.name = name
        self.location = location
        self.latitude = latitude
        self.longitude = longitude
        self.archive = archive
        self.user_id = user_id

    def __repr__(self):
        return repr(self.name)

    @staticmethod
    def add_cell_by_user_email(name, location, latitude, longitude, archive, userEmail):
        user_id = User.get_user_by_email(userEmail).id
        new_cell = Cell(
            name=name,
            location=location,
            latitude=latitude,
            longitude=longitude,
            user_id=user_id,
            archive=archive,
        )
        new_cell.save()
        return new_cell

    @staticmethod
    def get(id):
        return Cell.query.filter_by(id=id).first()
    
    def find_by_name(name):
        return Cell.query.filter_by(name=name).first()

    @staticmethod
    def get_cells_by_user_id(id):
        return Cell.query.filter_by(user_id=id).all()

    @staticmethod
    def get_all():
        return Cell.query.all()

    def save(self):
        db.session.add(self)
        db.session.commit()

    def delete(self):
        db.session.delete(self)
        db.session.commit()


class Tag(db.Model):
    """Table of Tags"""

    __tablename__ = "tag"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.Text(), nullable=False, unique=True)

    cells = db.relationship("Cell", secondary=Cell_Tag.__table__, backref="tag")

    def __init__(self, name):
        self.name = name

    def __repr__(self):
        return repr(self.name)
