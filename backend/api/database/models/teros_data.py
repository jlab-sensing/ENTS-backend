from ..models import db
from sqlalchemy.sql import func
from .cell import Cell
from datetime import datetime, timezone, timedelta
from dateutil.relativedelta import relativedelta


class TEROSData(db.Model):
    """Table for TEROS-12 Data"""

    __tablename__ = "teros_data"

    id = db.Column(db.Integer, primary_key=True)
    cell_id = db.Column(
        db.Integer, db.ForeignKey("cell.id", ondelete="CASCADE"), nullable=False
    )
    ts = db.Column(db.DateTime, nullable=False)
    ts_server = db.Column(db.DateTime, server_default=func.now())
    vwc = db.Column(db.Float)
    raw_vwc = db.Column(db.Float)
    temp = db.Column(db.Float)
    ec = db.Column(db.Integer)
    water_pot = db.Column(db.Float)

    cell = db.relationship("Cell")

    def __repr__(self):
        return f"TEROSData(id={self.id!r}, ts={self.ts!r})"

    def add_teros_data(cell_name, ts, vwc, raw_vwc, temp, ec, water_pot):
        cur_cell = Cell.query.filter_by(name=cell_name).first()
        if cur_cell is None:
            new_cell = Cell(name=cell_name)
            new_cell.save()
            cur_cell = Cell.query.filter_by(name=cell_name).first()
        teros_data = TEROSData(
            cell_id=cur_cell.id,
            ts=ts,
            raw_vwc=raw_vwc,
            vwc=vwc,
            temp=temp,
            ec=ec,
            water_pot=water_pot,
        )
        db.session.add(teros_data)
        db.session.commit()
        return teros_data

    @staticmethod
    def add_protobuf_teros_data(cell_id, ts, vwc, raw_vwc, temp, ec, water_pot):
        cur_cell = Cell.query.filter_by(id=cell_id).first()
        if cur_cell is None:
            return None
        teros_data = TEROSData(
            cell_id=cur_cell.id,
            ts=ts,
            raw_vwc=raw_vwc,
            vwc=vwc,
            temp=temp,
            ec=ec,
            water_pot=water_pot,
        )
        db.session.add(teros_data)
        db.session.commit()
        return teros_data

    def get_teros_data_obj(
        cell_id,
        start_time=datetime.now() - relativedelta(months=1),
        end_time=datetime.now(),
        stream=False,
    ):
        """gets teros data as a list of objects"""
        data = {
            "timestamp": [],
            "vwc": [],
            "temp": [],
            "ec": []
        }

        # VWC stored in decimal, converted to percentage
        stmt = (
            db.select(
                TEROSData.ts_server.label("ts"),
                (TEROSData.vwc * 100).label("vwc"),
                TEROSData.temp.label("temp"),
                TEROSData.ec.label("ec"),
            )
            .where(TEROSData.cell_id == cell_id)
            .filter((TEROSData.ts.between(start_time, end_time)))
            .order_by(TEROSData.ts)
        )
        
        utc_tz = timezone.utc
        la_tz = timezone(timedelta(hours=-8))

        for row in db.session.execute(stmt):
            data["timestamp"].append(row.ts.replace(utc_tz).astimezone(la_tz))
            data["vwc"].append(row.vwc)
            data["temp"].append(row.temp)
            data["ec"].append(row.ec)

        return data
