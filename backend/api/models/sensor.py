from ..models import db
from .cell import Cell
from .data import Data
from datetime import datetime
from dateutil.relativedelta import relativedelta


class Sensor(db.Model):
    """Table of sensors"""

    __tablename__ = "sensor"

    id = db.Column(db.Integer, primary_key=True)
    cell_id = db.Column(
        db.Integer, db.ForeignKey("cell.id", ondelete="CASCADE"), nullable=False
    )
    measurement = db.Column(db.Text(), nullable=False)
    data_type = db.Column(db.Text(), nullable=False)
    unit = db.Column(db.Text())
    name = db.Column(db.Text(), nullable=False)

    cell = db.relationship("Cell")

    def __repr__(self):
        return repr(self.name)

    def save(self):
        db.session.add(self)
        db.session.commit()

    @classmethod
    def get_all(sensor):
        return sensor.query.all()

    @classmethod
    def get_data(sensor, id):
        sensor.query.join(Data).filter(Sensor.id == id)

    @staticmethod
    def get_sensor_data_obj(
        name,
        cell_id,
        measurement,
        resample="hour",
        start_time=datetime.now() - relativedelta(months=1),
        end_time=datetime.now(),
        stream=False,
    ):
        """gets sensor data as a list of objects"""

        data = {
            "timestamp": [],
            "data": [],
            "measurement": "",
            "unit": "",
            "type": "",
        }

        cur_sensor = Sensor.query.filter_by(
            name=name, measurement=measurement, cell_id=cell_id
        ).first()

        if cur_sensor is None:
            return data

        if cur_sensor.data_type == "float":
            t_data = Data.float_val
        elif cur_sensor.data_type == "int":
            t_data = Data.int_val
        elif cur_sensor.data_type == "text":
            t_data = Data.text_val
        if not stream:
            # select from actual timestamp and aggregate data
            if resample == "none":
                # resampling is not required: select data without aggregate functions
                stmt = (
                    db.select(
                        Data.ts.label("ts"),
                        t_data.label("data"),
                    )
                    .where(Data.sensor_id == cur_sensor.id)
                    .filter(Data.ts.between(start_time, end_time))
                )
            else:
                # handle normal resampling case
                resampled = (
                    db.select(
                        db.func.date_trunc(resample, Data.ts).label("ts"),
                        db.func.avg(t_data).label("data"),
                    )
                    .where(Data.sensor_id == cur_sensor.id)
                    .filter(Data.ts.between(start_time, end_time))
                    .group_by(db.func.date_trunc(resample, Data.ts))
                    .subquery()
                )

                stmt = db.select(
                    resampled.c.ts.label("ts"),
                    (resampled.c.data).label("data"),
                ).order_by(resampled.c.ts)
        else:
            # select based off server timestamp for streaming data
            # need due to no central clock on sensors
            stmt = (
                db.select(
                    Data.ts.label("ts"),
                    t_data.label("data"),
                )
                .where(Data.sensor_id == cur_sensor.id)
                .filter(Data.ts.between(start_time, end_time))
            )
        for row in db.session.execute(stmt):
            data["timestamp"].append(row.ts)
            data["data"].append(row.data)
        data["measurement"] = cur_sensor.measurement
        data["unit"] = cur_sensor.unit
        data["type"] = cur_sensor.data_type
        return data

    @staticmethod
    def add_data(
        meas_name: str,
        meas_unit: str,
        meas_dict: dict,
    ):
        """Adds new data point for sensor

        If sensor does not exit then one is created based on data in meas. The
        name of the sensor is determined from the type of messages received.

        A new sensor will be create if one does not exist.

        Params:

            meas: Dictionary of measurement
            meas_type: Type of measurement to add to database

        Returns:
            The created Sensor object
        """

        name = meas_dict["type"]
        cell_id = meas_dict["cellId"]
        meas_data = meas_dict["data"][meas_name]
        meas_type = type(meas_data).__name__
        ts = datetime.fromtimestamp(meas_dict["ts"])

        # check if cell exists
        cur_cell = Cell.query.filter_by(id=cell_id).first()
        if cur_cell is None:
            return None

        # check if sensor exists that has the same name, measurement, and
        # cell_id
        cur_sensor = Sensor.query.filter_by(
            name=name,
            measurement=meas_name,
            cell_id=cur_cell.id,
        ).first()

        # create if doesn't exist
        if cur_sensor is None:
            new_sensor = Sensor(
                name=name,
                cell_id=cur_cell.id,
                measurement=meas_name,
                unit=meas_unit,
                data_type=meas_type,
            )
            new_sensor.save()
            cur_sensor = Sensor.query.filter_by(
                name=name,
                measurement=meas_name,
                cell_id=cur_cell.id,
            ).first()

        # add data based on measurement type
        if meas_type == "float":
            sensor_data = Data(
                sensor_id=cur_sensor.id,
                # measurement=measurement,
                ts=ts,
                float_val=meas_data,
            )
        elif meas_type == "int":
            sensor_data = Data(
                sensor_id=cur_sensor.id,
                # measurement=measurement,
                ts=ts,
                int_val=meas_data,
            )
        elif meas_type == "text":
            sensor_data = Data(
                sensor_id=cur_sensor.id,
                # measurement=measurement,
                ts=ts,
                text_val=meas_data,
            )
        sensor_data.save()
        return sensor_data
