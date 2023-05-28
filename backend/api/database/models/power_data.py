from ..models import *
from .logger import Logger


class PowerData(db.Model):
    """Table for power measurements"""

    __tablename__ = "power_data"

    id = db.Column(db.Integer, primary_key=True)
    logger_id = db.Column(db.Integer, db.ForeignKey("logger.id"))
    cell_id = db.Column(db.Integer, db.ForeignKey("cell.id", ondelete="CASCADE"),
                        nullable=False)
    ts = db.Column(db.DateTime, nullable=False)
    ts_server = db.Column(db.DateTime, server_default=db.func.now())
    current = db.Column(db.Integer)
    voltage = db.Column(db.Integer)

    cell = db.relationship("Cell")
    logger = db.relationship("Logger")

    def __repr__(self):
        return f"PowerData(id={self.id!r}, ts={self.ts!r})"

    def add_power_data(logger_name, cell_name, ts, v, i):
        cur_logger = Logger.query.filter_by(name=logger_name).first()
        cur_cell = Cell.query.filter_by(name=cell_name).first()
        if cur_cell is None:
            new_cell = Cell(name=cell_name)
            new_cell.save()
            cur_cell = Cell.query.filter_by(name=cell_name).first()
        if cur_logger is None:
            new_logger = Logger(name=logger_name)
            new_logger.save()
            cur_logger = Logger.query.filter_by(name=logger_name).first()
        power_data = PowerData(logger_id=cur_logger.id, cell_id=cur_cell.id,
                               ts=ts, voltage=v, current=i)
        db.session.add(power_data)
        db.session.commit()
        return power_data

    def get_power_data(cell_id, resample='hour'):
        data = []

        resampled = (
            db.select(
                db.func.date_trunc(resample, PowerData.ts).label("ts"),
                db.func.avg(PowerData.voltage).label("voltage"),
                db.func.avg(PowerData.current).label("current")
            )
            .where(PowerData.cell_id == cell_id)
            .group_by(db.func.date_trunc(resample, PowerData.ts))
            .subquery()
        )

        adj_units = (
            db.select(
                resampled.c.ts.label("ts"),
                (resampled.c.voltage * 10e-9).label("voltage"),
                (resampled.c.current * 10e-6).label("current")
            )
            .subquery()
        )

        stmt = (
            db.select(
                adj_units.c.ts.label("ts"),
                adj_units.c.voltage.label("voltage"),
                adj_units.c.current.label("current"),
                (adj_units.c.voltage * adj_units.c.current).label("power")
            )
            .order_by(adj_units.c.ts)
        )

        for row in db.session.execute(stmt):
            data.append({
                "ts": row.ts,
                "v": row.voltage,
                "i": row.current,
                "p": row.power,
            })

        return data

    def get_power_data_obj(cell_id, resample='hour'):
        data = {
            'timestamp': [],
            'v': [],
            'i': [],
            'p': [],
        }

        resampled = (
            db.select(
                db.func.date_trunc(resample, PowerData.ts).label("ts"),
                db.func.avg(PowerData.voltage).label("voltage"),
                db.func.avg(PowerData.current).label("current")
            )
            .where(PowerData.cell_id == cell_id)
            .group_by(db.func.date_trunc(resample, PowerData.ts))
            .subquery()
        )

        adj_units = (
            db.select(
                resampled.c.ts.label("ts"),
                (resampled.c.voltage * 10e-9).label("voltage"),
                (resampled.c.current * 10e-6).label("current")
            )
            .subquery()
        )

        stmt = (
            db.select(
                adj_units.c.ts.label("ts"),
                adj_units.c.voltage.label("voltage"),
                adj_units.c.current.label("current"),
                (adj_units.c.voltage * adj_units.c.current).label("power")
            )
            .order_by(adj_units.c.ts)
        )

        for row in db.session.execute(stmt):
            data["timestamp"].append(row.ts)
            data["v"].append(row.voltage)
            data["i"].append(row.current)
            data["p"].append(row.power)

        return data
