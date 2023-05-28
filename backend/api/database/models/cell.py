from ..models import *


class Cell(db.Model):
    """Table of cells"""

    __tablename__ = "cell"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.Text(), nullable=False, unique=True)
    location = db.Column(db.Text())
    # teros_data = db.relationship(
    #     "TEROSData", back_populates="cell")
    # power_data = db.relationship("PowerData", back_populates="cell")

    def __repr__(self):
        return repr(self.name)

    @classmethod
    def get_all(cell):
        cell.query.all()

    def save(self):
        db.session.add(self)
        db.session.commit()

    # def delete(self):
    #     db.session.delete(self)
    #     db.session.commit()
