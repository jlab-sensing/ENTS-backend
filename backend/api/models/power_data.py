from ..models import db
from sqlalchemy.sql import func
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

    # SHOULD NOT USE LOGGER NAME, SHOULD USE LOGGER ID
    #this is actually kinda pointless right now, its only used for a direct post request from the frontend to power_data, which is never done 
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

        stmt = None

        if not stream:
            # select from actual timestamp and aggregate data
            if resample == "none":
                # resampling is not required: select data without aggregate functions
                stmt = (
                    db.select(
                        PowerData.ts.label("ts"),
                        (PowerData.voltage * 1e3).label("voltage"),
                        (PowerData.current * 1e6).label("current"),
                        (PowerData.voltage * PowerData.current * 1e6).label("power"),
                    )
                    .where(
                        (PowerData.cell_id == cell_id)
                        & (PowerData.ts.between(start_time, end_time))
                    )
                    .order_by(PowerData.ts)
                )
            else:
                # Handle normal resampling case
                date_trunc = db.func.date_trunc(resample, PowerData.ts)
                stmt = (
                    db.select(
                        date_trunc.label("ts"),
                        func.avg(PowerData.voltage * 1e3).label("voltage"),
                        func.avg(PowerData.current * 1e6).label("current"),
                        func.avg((PowerData.voltage * PowerData.current * 1e6)).label(
                            "power"
                        ),
                    )
                    .where(
                        (PowerData.cell_id == cell_id)
                        & (PowerData.ts.between(start_time, end_time))
                    )
                    .group_by(date_trunc)
                    .order_by(date_trunc)
                )
        else:
            # select based off server timestamp for streaming data
            stmt = (
                db.select(
                    PowerData.ts_server.label("ts"),
                    (PowerData.voltage * 1e3).label("voltage"),
                    (PowerData.current * 1e6).label("current"),
                    (PowerData.voltage * PowerData.current * 1e6).label("power"),
                )
                .where(
                    (PowerData.cell_id == cell_id)
                    & (PowerData.ts.between(start_time, end_time))
                )
                .order_by(PowerData.ts_server)
            )
        # turn into dictionary
        for row in db.session.execute(stmt).yield_per(1000):
            data["timestamp"].append(row.ts)
            data["v"].append(row.voltage)
            data["i"].append(row.current)
            data["p"].append(row.power)

        return data
