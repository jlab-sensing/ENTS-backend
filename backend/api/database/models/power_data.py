from ..models import db
from .cell import Cell
from .logger import Logger
from datetime import datetime, timezone, timedelta
from dateutil.relativedelta import relativedelta


class PowerData(db.Model):
    """Table for power measurements"""

    __tablename__ = "power_data"

    id = db.Column(db.Integer, primary_key=True)
    logger_id = db.Column(db.Integer, db.ForeignKey("logger.id"))
    cell_id = db.Column(
        db.Integer, db.ForeignKey("cell.id", ondelete="CASCADE"), nullable=False
    )
    ts = db.Column(db.DateTime, nullable=False)
    ts_server = db.Column(db.DateTime, server_default=db.func.now())
    current = db.Column(db.Float)
    voltage = db.Column(db.Float)

    cell = db.relationship("Cell")
    logger = db.relationship("Logger")

    def __repr__(self):
        return f"PowerData(id={self.id!r}, ts={self.ts!r})"

    def add_power_data(logger_name, cell_name, ts, v, i):
        """add new data point for power table
        creates new logger or cell if they don't exist
        """
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
        power_data = PowerData(
            logger_id=cur_logger.id, cell_id=cur_cell.id, ts=ts, voltage=v, current=i
        )
        db.session.add(power_data)
        db.session.commit()
        return power_data

    @staticmethod
    def add_protobuf_power_data(logger_id, cell_id, ts, v, i):
        """add new data point for power table
        creates new logger or cell if they don't exist
        """
        cur_logger = Logger.query.filter_by(id=logger_id).first()
        cur_cell = Cell.query.filter_by(id=cell_id).first()
        if cur_cell is None:
            return None
        if cur_logger is None:
            return None
        power_data = PowerData(
            logger_id=cur_logger.id, cell_id=cur_cell.id, ts=ts, voltage=v, current=i
        )
        db.session.add(power_data)
        db.session.commit()
        return power_data

    def get_power_data_obj(
        cell_id,
        start_time=datetime.now() - relativedelta(months=1),
        end_time=datetime.now(),
        stream=False,
    ):
        """gets teros data as a list of objects"""
        data = {
            "timestamp": [],
            "v": [],
            "i": [],
            "p": [],
        }

        stmt = (
            db.select(
                PowerData.ts_server.label("ts"),
                PowerData.voltage.label("voltage"),
                PowerData.current.label("current"),
            )
            .where(PowerData.cell_id == cell_id) 
            .filter((PowerData.ts.between(start_time, end_time)))
            .subquery()
        )

        # expected units are mV, uA, and uW
        adj_units = db.select(
            stmt.c.ts.label("ts"),
            (stmt.c.voltage * 1e-3).label("voltage"),
            (stmt.c.current * 1e-6).label("current"),
            (stmt.c.voltage * stmt.c.current * 1e-6).label("power")
        ).order_by(stmt.c.ts)
        
        utc_tz = timezone.utc
        la_tz = timezone(timedelta(hours=-8))

        for row in db.session.execute(adj_units):
            data["timestamp"].append(row.ts.replace(tzinfo=utc_tz).astimezone(la_tz))
            data["v"].append(row.voltage)
            data["i"].append(row.current)
            data["p"].append(row.power)

        return data
