from ..models import db
from sqlalchemy.sql import func
from .cell import Cell
from datetime import datetime
from dateutil.relativedelta import relativedelta


class TEROSData(db.Model):
    """Table for TEROS-12 Data"""

    __tablename__ = "teros_data"
    __table_args__ = (db.Index("idx_teros_data_cell_id_ts", "cell_id", "ts"),)

    id = db.Column(db.Integer, primary_key=True)
    cell_id = db.Column(
        db.Integer, db.ForeignKey("cell.id", ondelete="CASCADE"), nullable=False
    )
    ts = db.Column(db.DateTime, nullable=False, index=True)
    ts_server = db.Column(db.DateTime, server_default=func.now(), index=True)
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
        resample="hour",
        start_time=None,
        end_time=None,
        stream=False,
    ):
        """gets teros data as a list of objects

        The stream parameter controls data aggregation and timestamp. When False
        the data is aggregated according to the resample argument and the
        timestamp is from the measurement itself. When True, no data aggregation
        is preformed and the timestamp is when the measurement is inserted into
        the server.
        """

        if start_time is None:
            start_time = datetime.now() - relativedelta(months=1)
        if end_time is None:
            end_time = datetime.now()

        data = {"timestamp": [], "vwc": [], "temp": [], "ec": [], "raw_vwc": []}

        stmt = None

        if not stream:
            if resample == "none":
                # resampling is not required: select data without aggregate functions
                stmt = (
                    db.select(
                        TEROSData.ts.label("ts"),
                        (TEROSData.vwc * 100).label("vwc"),
                        TEROSData.temp.label("temp"),
                        TEROSData.ec.label("ec"),
                        TEROSData.raw_vwc.label("raw_vwc"),
                    )
                    .where(
                        (TEROSData.cell_id == cell_id)
                        & (TEROSData.ts.between(start_time, end_time))
                    )
                    .order_by(TEROSData.ts)
                )
            else:
                # Handle normal resampling case
                date_trunc = func.date_trunc(resample, TEROSData.ts).label("ts")
                stmt = (
                    db.select(
                        date_trunc.label("ts"),
                        func.avg(TEROSData.vwc * 100).label("vwc"),
                        func.avg(TEROSData.temp).label("temp"),
                        func.avg(TEROSData.ec).label("ec"),
                        func.avg(TEROSData.raw_vwc).label("raw_vwc"),
                    )
                    .where(
                        (TEROSData.cell_id == cell_id)
                        & (TEROSData.ts.between(start_time, end_time))
                    )
                    .group_by(date_trunc)
                    .order_by(date_trunc)
                )
        else:
            # using server timestamps
            stmt = (
                db.select(
                    TEROSData.ts_server.label("ts"),
                    (TEROSData.vwc * 100).label("vwc"),
                    TEROSData.temp.label("temp"),
                    TEROSData.ec.label("ec"),
                    TEROSData.raw_vwc.label("raw_vwc"),
                )
                .where(
                    (TEROSData.cell_id == cell_id)
                    & (TEROSData.ts.between(start_time, end_time))
                )
                .order_by(TEROSData.ts)
            )

        for row in db.session.execute(stmt).yield_per(1000):
            data["timestamp"].append(row.ts)
            data["vwc"].append(row.vwc)
            data["temp"].append(row.temp)
            # returns decimals as integers for chart parsing
            data["ec"].append(int(row.ec))
            data["raw_vwc"].append(row.raw_vwc)
        return data
