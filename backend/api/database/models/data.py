from ..models import db


class Data(db.Model):
    """Table of data"""

    __tablename__ = "data"

    id = db.Column(db.Integer, primary_key=True)
    sensor_id = db.Column(
        db.Integer, db.ForeignKey("sensor.id", ondelete="CASCADE"), nullable=False
    )
    ts = db.Column(db.DateTime, nullable=False, index=True)
    ts_server = db.Column(db.DateTime, server_default=db.func.now(), index=True)
    float_val = db.Column(db.Float, nullable=True)
    int_val = db.Column(db.Integer, nullable=True)
    text_val = db.Column(db.Text(), nullable=True)

    def __repr__(self):
        return repr(self.name)

    @classmethod
    def get_all(data):
        data.query.all()

    def save(self):
        db.session.add(self)
        db.session.commit()
