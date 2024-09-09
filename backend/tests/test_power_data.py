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


def test_get_power_obj_ts_ordered(init_database):
    """
    GIVEN a Cell Data arguments
    WHEN Power Data is in database
    THEN check if timestamps are in order
    """
    ts_jan_13_2024 = 1705176162
    ts_jan_14_2024 = 1705266590
    ts_jan_15_2024 = 1705352990
    formated_ts_jan_13_2024 = datetime.fromtimestamp(ts_jan_13_2024)
    formated_ts_jan_14_2024 = datetime.fromtimestamp(ts_jan_14_2024)
    formated_ts_jan_15_2024 = datetime.fromtimestamp(ts_jan_15_2024)

    cell = Cell("cell_5", "", 1, 1, False, None)
    cell.save()
    PowerData.add_power_data("logger_1", "cell_5", formated_ts_jan_13_2024, 1, 2)
    PowerData.add_power_data("logger_1", "cell_5", formated_ts_jan_15_2024, 1, 2)
    PowerData.add_power_data("logger_1", "cell_5", formated_ts_jan_14_2024, 1, 2)
    power_data_obj = PowerData.get_power_data_obj(
        cell.id, "none", formated_ts_jan_13_2024, formated_ts_jan_15_2024, False
    )
    assert formated_ts_jan_13_2024 == power_data_obj["timestamp"][0]
    assert formated_ts_jan_14_2024 == power_data_obj["timestamp"][1]
    assert formated_ts_jan_15_2024 == power_data_obj["timestamp"][2]
    # decimal multipled by 100 as a percentage
    assert 1 * 1e3 in power_data_obj["v"]
    assert 2 * 1e6 in power_data_obj["i"]
    assert 1 * 2 * 1e6 in power_data_obj["p"]


def test_get_power_obj_hour_ts_ordered(init_database):
    """
    GIVEN a Cell Data arguments
    WHEN Power Data is in database with hourly resampling
    THEN check if timestamps are in order
    """
    ts_jan_13_2024 = 1705176162
    ts_jan_14_2024 = 1705266590
    ts_jan_15_2024 = 1705352990
    formated_ts_jan_13_2024 = datetime.fromtimestamp(ts_jan_13_2024)
    formated_ts_jan_14_2024 = datetime.fromtimestamp(ts_jan_14_2024)
    formated_ts_jan_15_2024 = datetime.fromtimestamp(ts_jan_15_2024)

    cell = Cell("cell_6", "", 1, 1, False, None)
    cell.save()
    PowerData.add_power_data("logger_1", "cell_6", formated_ts_jan_13_2024, 1, 2)
    PowerData.add_power_data("logger_1", "cell_6", formated_ts_jan_15_2024, 1, 2)
    PowerData.add_power_data("logger_1", "cell_6", formated_ts_jan_14_2024, 1, 2)
    power_data_obj = PowerData.get_power_data_obj(
        cell.id, "hour", formated_ts_jan_13_2024, formated_ts_jan_15_2024, False
    )
    # splice out minutes
    formated_ts_jan_13_2024 = datetime.fromtimestamp(ts_jan_13_2024).replace(
        minute=0, second=0, tzinfo=None
    )
    formated_ts_jan_14_2024 = datetime.fromtimestamp(ts_jan_14_2024).replace(
        minute=0, second=0, tzinfo=None
    )
    formated_ts_jan_15_2024 = datetime.fromtimestamp(ts_jan_15_2024).replace(
        minute=0, second=0, tzinfo=None
    )
    assert formated_ts_jan_13_2024 == power_data_obj["timestamp"][0]
    assert formated_ts_jan_14_2024 == power_data_obj["timestamp"][1]
    assert formated_ts_jan_15_2024 == power_data_obj["timestamp"][2]
    # decimal multipled by 100 as a percentage
    assert 1 * 1e3 in power_data_obj["v"]
    assert 2 * 1e6 in power_data_obj["i"]
    assert 1 * 2 * 1e6 in power_data_obj["p"]


def test_new_power_protobuf_data(init_database):
    """
    GIVEN a TEROS Data arguments
    WHEN a new TEROS Data is created
    THEN check the vwc, raw vwc, temp, ec, water potential is defined correctly
    """
    ts = 1705176162
    formated_ts = datetime.fromtimestamp(ts)
    logger = Logger("logger_3", None, "")
    logger.save()
    cell = Cell("cell_7", "", 1, 1, False, None)
    cell.save()
    power_data = PowerData.add_protobuf_power_data(
        logger.id, cell.id, formated_ts, 3, 4
    )
    assert power_data.cell.name == "cell_7"
    assert datetime.timestamp(power_data.ts) == 1705176162
    assert 3 == power_data.voltage
    assert 4 == power_data.current
