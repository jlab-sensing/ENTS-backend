from api.models.power_data import PowerData
from api.models.cell import Cell
from api.models.logger import Logger
from datetime import datetime


def test_new_power_data(init_database):
    """
    GIVEN a Power Data arguments
    WHEN a new Power Data is created
    THEN check the voltage, current, logger, cell fields are defined correctly
    """
    ts = 1705176162
    formated_ts = datetime.fromtimestamp(ts)
    Logger("logger_1", None, "").save()
    Cell("cell_1", "", 1, 1, False, None).save()
    power_data = PowerData.add_power_data("logger_1", "cell_1", formated_ts, 1, 2)
    assert power_data.logger.name == "logger_1"
    assert power_data.cell.name == "cell_1"
    assert datetime.timestamp(power_data.ts) == 1705176162
    assert power_data.voltage == 1
    assert power_data.current == 2


def test_new_power_data_cell_creation(init_database):
    """
    GIVEN a Power Data arguments
    WHEN a new Power Data is created and a new cell does not exist
    THEN check if a new cell is created
    """
    ts = 1705176162
    formated_ts = datetime.fromtimestamp(ts)
    power_data = PowerData.add_power_data("logger_2", "cell_2", formated_ts, 1, 2)
    assert power_data.cell.name == "cell_2"
    print(power_data.cell_id)
    cell = Cell.get(power_data.cell_id)
    assert cell


def test_get_power_obj(init_database):
    """
    GIVEN a Cell Data arguments
    WHEN Power Data is in database
    THEN check if Power Data returned correctly
    """
    ts = 1705176162
    formated_ts = datetime.fromtimestamp(ts)
    cell = Cell("cell_3", "", 1, 1, False, None)
    cell.save()
    PowerData.add_power_data("logger_1", "cell_3", formated_ts, 1, 2)
    power_data_obj = PowerData.get_power_data_obj(
        cell.id, "none", formated_ts, formated_ts, False
    )
    datetime.fromtimestamp(ts).replace(minute=0, second=0, tzinfo=None)
    assert formated_ts in power_data_obj["timestamp"]
    # decimal multipled by 100 as a percentage
    assert 1 * 1e3 in power_data_obj["v"]
    assert 2 * 1e6 in power_data_obj["i"]
    assert 1 * 2 * 1e6 in power_data_obj["p"]


def test_get_power_obj_hour(init_database):
    """
    GIVEN a Cell Data arguments
    WHEN Power Data is in database with hourly resampling
    THEN check if Power Data returned correctly
    """
    ts = 1705176162
    formated_ts = datetime.fromtimestamp(ts)
    cell = Cell("cell_4", "", 1, 1, False, None)
    cell.save()
    PowerData.add_power_data("logger_1", "cell_4", formated_ts, 1, 2)
    power_data_obj = PowerData.get_power_data_obj(
        cell.id, "hour", formated_ts, formated_ts, False
    )
    # splice out minutes
    formated_ts = datetime.fromtimestamp(ts).replace(minute=0, second=0, tzinfo=None)
    assert formated_ts in power_data_obj["timestamp"]
    # decimal multipled by 100 as a percentage
    assert 1 * 1e3 in power_data_obj["v"]
    assert 2 * 1e6 in power_data_obj["i"]
    assert 1 * 2 * 1e6 in power_data_obj["p"]


#  for row in db.session.execute(adj_units):
#             data["timestamp"].append(row.ts)
#             data["v"].append(row.voltage)
#             data["i"].append(row.current)
#             data["p"].append(row.power)
