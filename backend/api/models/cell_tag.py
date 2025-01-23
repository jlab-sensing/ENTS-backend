from ..models import db

class Cell_Tag(db.Model):
    """Table of cell/tag relationships"""

    __tablename__ = "cell_tag"

    cell_id = db.Column(db.Integer, db.ForeignKey("cell.id"), primary_key = True)
    tag_id = db.Column(db.Integer, db.ForeignKey("tag.id"), primary_key = True)

    