from ....api import db
from sqlalchemy.sql import func


def vwc(raw):
    return (6.771*(10**-10)) * (raw**3) + (-5.105*(10**-6)) * (raw**2) + (1.302*(10**-2)) * (raw) - 10.848


class TEROSData(db.Model):
    """Table for TEROS-12 Data"""

    __tablename__ = "teros_data"

    id = db.Column(db.Integer, primary_key=True)
    cell_id = db.Column(db.Integer, db.ForeignKey("cell.id", ondelete="CASCADE"),
                        nullable=False)
    ts = db.Column(db.DateTime, nullable=False)
    ts_server = db.Column(db.DateTime, server_default=func.now())
    vwc = db.Column(db.Float)
    temp = db.Column(db.Float)
    ec = db.Column(db.Integer)

    # cell = db.relationship("Cell", back_populates="teros_data")

    def __repr__(self):
        return f"TEROSData(id={self.id!r}, ts={self.ts!r})"

    def get_teros_data(cell_id, resample='hour'):
        data = []

        stmt = (
            db.select(
                func.date_trunc(resample, TEROSData.ts).label("ts"),
                func.avg(TEROSData.vwc).label("vwc"),
                func.avg(TEROSData.temp).label("temp"),
                func.avg(TEROSData.ec).label("ec"),
            )
            .where(TEROSData.cell_id == cell_id)
            .group_by(func.date_trunc(resample, TEROSData.ts))
            .order_by(func.date_trunc(resample, TEROSData.ts))
        )

        for row in db.session.execute(stmt):
            data.append({
                "ts": row.ts,
                "vwc": vwc(row.vwc),
                "temp": row.temp,
                "ec": row.ec,
            })
        return data

    def get_teros_data_obj(cell_id, resample='hour'):
        data = {
            'timestamp': [],
            'vwc': [],
            'temp': [],
            'ec': []
        }

        stmt = (
            db.select(
                func.date_trunc(resample, TEROSData.ts).label("ts"),
                func.avg(TEROSData.vwc).label("vwc"),
                func.avg(TEROSData.temp).label("temp"),
                func.avg(TEROSData.ec).label("ec")
            )
            .where(TEROSData.cell_id == cell_id)
            .group_by(func.date_trunc(resample, TEROSData.ts))
            .order_by(func.date_trunc(resample, TEROSData.ts))
        )

        for row in db.session.execute(stmt):
            data['timestamp'].append(row.ts)
            data['vwc'].append(vwc(row.vwc))
            data['temp'].append(row.temp)
            data['ec'].append(row.ec)

        return data
