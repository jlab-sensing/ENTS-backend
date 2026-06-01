from api.models.sensor import Sensor
from api.models.cell import Cell
from datetime import datetime


def test_new_sensor_data(init_database):
    """
    GIVEN a Sensor Data arguments
    WHEN a new Sensor Data is created
    THEN check the vwc, raw vwc, temp, ec, water potential is defined correctly
    """
    cell = Cell("cell_2", "", 1, 1, False, None)
    cell.save()

    # meas_dict
    # example:
    #    meas_sensor = {
    #     "type": "sensor_leaf",
    #     "cellId": "1",
    #     "data": {"power": 3, "current": 6},
    #     "data_type": {"power": "float", "current": "int"},
    #     "ts": 1705176162,
    # }

    meas_dict = {
        "type": "measurement_type",
        "cellId": cell.id,
        "data": {
            "measurement_name": 1,
        },
        # types: float, int, text
        "data_type": {
            "measurement_name": int,
        },
        "ts": 1705176162,
    }

    data = Sensor.add_data("measurement_name", "measurement_unit", meas_dict)
    sensor = Sensor.query.get(data.sensor_id)
    assert datetime.timestamp(data.ts) == 1705176162
    assert data.int_val == 1
    assert sensor.measurement == "measurement_name"
    assert sensor.data_type == "int"
    assert sensor.unit == "measurement_unit"
    assert sensor.name == "measurement_type"


#  name,
#         cell_id,
#         measurement,
#         resample="hour",
#         start_time=datetime.now() - relativedelta(months=1),
#         end_time=datetime.now(),
#         stream=False,


def test_get_sensor_obj(init_database):
    ts = 1705176162
    cell = Cell("cell_3", "", 1, 1, False, None)
    cell.save()
    meas_dict = {
        "type": "measurement_type",
        "cellId": cell.id,
        "data": {
            "measurement_name": 1,
        },
        # types: float, int, text
        "data_type": {
            "measurement_name": int,
        },
        "ts": ts,
    }
    formmated_ts = datetime.fromtimestamp(ts)

    data = Sensor.add_data("measurement_name", "measurement_unit", meas_dict)
    sensor = Sensor.query.get(data.sensor_id)

    sensor_data_obj = Sensor.get_sensor_data_obj(
        sensor.name,
        cell.id,
        sensor.measurement,
        "hour",
        formmated_ts,
        formmated_ts,
        False,
    )
    print(sensor_data_obj)
    formated_ts_spliced_hour = datetime.fromtimestamp(ts).replace(
        minute=0, second=0, tzinfo=None
    )
    assert sensor_data_obj["timestamp"][0] == formated_ts_spliced_hour
    assert sensor_data_obj["data"][0] == 1
    assert sensor_data_obj["measurement"] == "measurement_name"
    assert sensor_data_obj["unit"] == "measurement_unit"
    assert sensor_data_obj["type"] == "int"
    # for row in db.session.execute(stmt):
    #       data["timestamp"].append(row.ts)
    #       data["data"].append(row.data)
    #   data["measurement"] = cur_sensor.measurement
    #   data["unit"] = cur_sensor.unit
    #   data["type"] = cur_sensor.data_type


#  measurement = db.Column(db.Text(), nullable=False)
#     data_type = db.Column(db.Text(), nullable=False)
#     unit = db.Column(db.Text())
#     name = db.Column(db.Text(), nullable=False)
