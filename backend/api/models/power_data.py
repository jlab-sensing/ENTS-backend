from ..models import db
from .cell import Cell
from .logger import Logger
from datetime import datetime
from dateutil.relativedelta import relativedelta


class PowerData(db.Model):
    """Table for power measurements"""

    __tablename__ = "power_data"

    id = db.Column(db.Integer, primary_key=True)
    logger_id = db.Column(db.Integer, db.ForeignKey("logger.id"))
    cell_id = db.Column(
        db.Integer, db.ForeignKey("cell.id", ondelete="CASCADE"), nullable=False
    )
    ts = db.Column(db.DateTime, nullable=False, index=True)
    ts_server = db.Column(db.DateTime, server_default=db.func.now(), index=True)
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
        resample="hour",
        start_time=datetime.now() - relativedelta(months=1),
        end_time=datetime.now(),
        stream=False,
    ):
        """gets power data as a list of objects

        The stream parameter controls data aggregation and timestamp. When False
        the data is aggregated according to the resample argument and the
        timestamp is from the measurement itself. When True, no data aggregation
        is preformed and the timestamp is when the measurement is inserted into
        the server.
        """

        data = {
            "timestamp": [],
            "v": [],
            "i": [],
            "p": [],
        }

        if not stream:
            # select from actual timestamp and aggregate data
            if resample == "none":
                # resampling is not required: select data without aggregate functions
                stmt = (
                    db.select(
                        PowerData.ts.label("ts"),
                        PowerData.voltage.label("voltage"),
                        PowerData.current.label("current"),
                    )
                    .where(PowerData.cell_id == cell_id)
                    .filter(PowerData.ts.between(start_time, end_time))
                    .subquery()
                )
            else:
                # Handle normal resampling case
                stmt = (
                    db.select(
                        db.func.date_trunc(resample, PowerData.ts).label("ts"),
                        db.func.avg(PowerData.voltage).label("voltage"),
                        db.func.avg(PowerData.current).label("current"),
                    )
                    .where((PowerData.cell_id == cell_id))
                    .filter((PowerData.ts.between(start_time, end_time)))
                    .group_by(db.func.date_trunc(resample, PowerData.ts))
                    .subquery()
                )
        else:
            # select based off server timestamp for streaming data
            stmt = (
                db.select(
                    PowerData.ts_server.label("ts"),
                    PowerData.voltage.label("voltage"),
                    PowerData.current.label("current"),
                )
                .where(PowerData.cell_id == cell_id)
                .filter((PowerData.ts_server.between(start_time, end_time)))
                .subquery()
            )

        # apply unit conversions
        # expected units are mV, uA, and uW
        adj_units = db.select(
            stmt.c.ts.label("ts"),
            (stmt.c.voltage * 1e3).label("voltage"),
            (stmt.c.current * 1e6).label("current"),
            (stmt.c.voltage * stmt.c.current * 1e6).label("power"),
        ).order_by(stmt.c.ts)

        # turn into dictionary
        for row in db.session.execute(adj_units):
            data["timestamp"].append(row.ts)
            data["v"].append(row.voltage)
            data["i"].append(row.current)
            data["p"].append(row.power)

        return data
