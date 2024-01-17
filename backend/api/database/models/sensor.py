from ..models import db, Data, Cell
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

    def __repr__(self):
        return repr(self.name)

    def save(self):
        db.session.add(self)
        db.session.commit()

    @classmethod
    def get_all(sensor):
        sensor.query.all()

    @classmethod
    def get_data(sensor, id):
        sensor.query.join(Data).filter(Sensor.id == id)

    @staticmethod
    def get_sensor_data_obj(
        cell_id,
        measurement,
        resample="hour",
        start_time=datetime.now() - relativedelta(months=1),
        end_time=datetime.now(),
    ):
        """gets sensor data as a list of objects"""
        print("running", flush=True)
        cur_sensor = Sensor.query.filter_by(
            measurement=measurement, cell_id=cell_id
        ).first()
        if cur_sensor is None:
            return None
        match cur_sensor.data_type:
            case "float":
                t_data = Data.float_val
            case "int":
                t_data = Data.int_val
            case "text":
                t_data = Data.text_val
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

        data = {
            "timestamp": [],
            "data": [],
            "measurement": "",
            "unit": "",
            "type": "",
        }
        for row in db.session.execute(stmt):
            print("row", row, flush=True)
            data["timestamp"].append(row.ts)
            data["data"].append(row.data)
        data["measurement"] = cur_sensor.measurement
        data["unit"] = cur_sensor.unit
        data["type"] = cur_sensor.data_type
        return data

    @staticmethod
    def add_data(
        cell_id,
        sensor_name,
        measurement,
        data,
        data_types,
        ts,
    ):
        """add new data point for sensor"""
        type = data_types[measurement]
        cur_cell = Cell.query.filter_by(id=cell_id).first()
        if cur_cell is None:
            return None
            # new_cell = Cell(name=cell_name)
            # new_cell.save()
            # cur_cell = Cell.query.filter_by(id=cell_id).first()
            # new_sensor = Sensor(
            #     name=sensor_name,
            #     cell_id=cur_cell.id,
            #     measurement=measurement,
            #     data_type=type,
            # )
            # new_sensor.save()
            # cur_sensor = Sensor.query.filter_by(id=new_sensor.id).first()
        else:
            cur_sensor = Sensor.query.filter_by(
                measurement=measurement,
                cell_id=cur_cell.id,
                data_type=type,
            ).first()
            if cur_sensor is None:
                new_sensor = Sensor(
                    name=sensor_name,
                    cell_id=cur_cell.id,
                    measurement=measurement,
                    unit="em",
                    data_type=type,
                )
                new_sensor.save()
                cur_sensor = Sensor.query.filter_by(
                    measurement=measurement,
                    cell_id=cur_cell.id,
                    data_type=type,
                ).first()
        match type:
            case "float":
                sensor_data = Data(
                    sensor_id=cur_sensor.id,
                    # measurement=measurement,
                    ts=ts,
                    float_val=data,
                )
            case "int":
                sensor_data = Data(
                    sensor_id=cur_sensor.id,
                    # measurement=measurement,
                    ts=ts,
                    int_val=data,
                )
            case "text":
                sensor_data = Data(
                    sensor_id=cur_sensor.id,
                    # measurement=measurement,
                    ts=ts,
                    text_val=data,
                )
        sensor_data.save()
        return sensor_data
