from api.models.teros_data import TEROSData
from api.models.cell import Cell
from api.models.logger import Logger
from datetime import datetime


def test_new_teros_data(init_database):
    """
    GIVEN a TEROS Data arguments
    WHEN a new TEROS Data is created
    THEN check the vwc, raw vwc, temp, ec, water potential is defined correctly
    """
    ts = 1705176162
    formated_ts = datetime.fromtimestamp(ts)
    Cell("cell_2", "", 1, 1, False, None).save()
    teros_data = TEROSData.add_teros_data("cell_2", formated_ts, 1, 2, 3, 4, 5)
    assert teros_data.cell.name == "cell_2"
    assert datetime.timestamp(teros_data.ts) == 1705176162
    assert teros_data.vwc == 1
    assert teros_data.raw_vwc == 2
    assert teros_data.temp == 3
    assert teros_data.ec == 4
    assert teros_data.water_pot == 5


def test_new_teros_data_cell_creation(init_database):
    """
    GIVEN a TEROS Data arguments
    WHEN a new TEROS Data is created and a new cell does not exist
    THEN check if a new cell is created
    """
    ts = 1705176162
    formated_ts = datetime.fromtimestamp(ts)
    Logger("logger_1", None, "").save()
    # Cell("cell_2", "", 1, 1, False, None).save()
    teros_data = TEROSData.add_teros_data("cell_3", formated_ts, 1, 2, 3, 4, 5)
    assert teros_data.cell.name == "cell_3"
    print(teros_data.cell_id)
    cell = Cell.get(teros_data.cell_id)
    assert cell


def test_new_teros_protobuf_data(init_database):
    """
    GIVEN a TEROS Data arguments
    WHEN a new TEROS Data is created
    THEN check the vwc, raw vwc, temp, ec, water potential is defined correctly
    """
    ts = 1705176162
    formated_ts = datetime.fromtimestamp(ts)
    cell = Cell("cell_4", "", 1, 1, False, None)
    cell.save()
    teros_data = TEROSData.add_protobuf_teros_data(cell.id, formated_ts, 1, 2, 3, 4, 5)
    assert teros_data.cell.name == "cell_4"
    assert datetime.timestamp(teros_data.ts) == 1705176162
    assert teros_data.vwc == 1
    assert teros_data.raw_vwc == 2
    assert teros_data.temp == 3
    assert teros_data.ec == 4
    assert teros_data.water_pot == 5


def test_get_teros_obj(init_database):
    """
    GIVEN a TEROS Data arguments
    WHEN a new TEROS Data is created
    THEN check the vwc, raw vwc, temp, ec, water potential is defined correctly
    """
    ts = 1705176162
    formated_ts = datetime.fromtimestamp(ts)
    cell = Cell("cell_6", "", 1, 1, False, None)
    cell.save()
    TEROSData.add_teros_data("cell_6", formated_ts, 1, 2, 3, 4, 5)
    teros_data_obj = TEROSData.get_teros_data_obj(
        cell.id, "none", formated_ts, formated_ts, False
    )
    assert formated_ts in teros_data_obj["timestamp"]
    # decimal multipled by 100 as a percentage
    assert 100 in teros_data_obj["vwc"]
    assert 2 in teros_data_obj["raw_vwc"]
    assert 3 in teros_data_obj["temp"]
    assert 4 in teros_data_obj["ec"]


def test_get_teros_obj_hour(init_database):
    """
    GIVEN a TEROS Data arguments
    WHEN a new TEROS Data is created
    THEN check the vwc, raw vwc, temp, ec, water potential is defined correctly
    """
    ts = 1705176162
    formated_ts = datetime.fromtimestamp(ts)
    cell = Cell("cell_5", "", 1, 1, False, None)
    cell.save()
    TEROSData.add_teros_data("cell_5", formated_ts, 1, 2, 3, 4, 5)
    teros_data_obj = TEROSData.get_teros_data_obj(
        cell.id, "hour", formated_ts, formated_ts, False
    )
    # splice out minutes
    formated_ts = datetime.fromtimestamp(ts).replace(minute=0, second=0, tzinfo=None)
    assert formated_ts in teros_data_obj["timestamp"]
    # decimal multipled by 100 as a percentage
    assert 100 in teros_data_obj["vwc"]
    assert 2 in teros_data_obj["raw_vwc"]
    assert 3 in teros_data_obj["temp"]
    assert 4 in teros_data_obj["ec"]


def test_get_power_obj_ts_ordered(init_database):
    """
    GIVEN a Cell Data arguments
    WHEN TEROS Data is in database
    THEN check if timestamps are in order
    """
    ts_jan_13_2024 = 1705176162
    ts_jan_14_2024 = 1705266590
    ts_jan_15_2024 = 1705352990
    formated_ts_jan_13_2024 = datetime.fromtimestamp(ts_jan_13_2024)
    formated_ts_jan_14_2024 = datetime.fromtimestamp(ts_jan_14_2024)
    formated_ts_jan_15_2024 = datetime.fromtimestamp(ts_jan_15_2024)

    cell = Cell("cell_7", "", 1, 1, False, None)
    cell.save()
    TEROSData.add_teros_data("cell_7", formated_ts_jan_13_2024, 1, 2, 3, 4, 5)
    TEROSData.add_teros_data("cell_7", formated_ts_jan_15_2024, 1, 2, 3, 4, 5)
    TEROSData.add_teros_data("cell_7", formated_ts_jan_14_2024, 1, 2, 3, 4, 5)
    teros_data_obj = TEROSData.get_teros_data_obj(
        cell.id, "none", formated_ts_jan_13_2024, formated_ts_jan_15_2024, False
    )
    assert formated_ts_jan_13_2024 == teros_data_obj["timestamp"][0]
    assert formated_ts_jan_14_2024 == teros_data_obj["timestamp"][1]
    assert formated_ts_jan_15_2024 == teros_data_obj["timestamp"][2]
    # decimal multipled by 100 as a percentage
    assert 100 in teros_data_obj["vwc"]
    assert 2 in teros_data_obj["raw_vwc"]
    assert 3 in teros_data_obj["temp"]
    assert 4 in teros_data_obj["ec"]


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

    cell = Cell("cell_8", "", 1, 1, False, None)
    cell.save()
    TEROSData.add_teros_data("cell_8", formated_ts_jan_13_2024, 1, 2, 3, 4, 5)
    TEROSData.add_teros_data("cell_8", formated_ts_jan_15_2024, 1, 2, 3, 4, 5)
    TEROSData.add_teros_data("cell_8", formated_ts_jan_14_2024, 1, 2, 3, 4, 5)
    teros_data_obj = TEROSData.get_teros_data_obj(
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
    assert formated_ts_jan_13_2024 == teros_data_obj["timestamp"][0]
    assert formated_ts_jan_14_2024 == teros_data_obj["timestamp"][1]
    assert formated_ts_jan_15_2024 == teros_data_obj["timestamp"][2]
    # decimal multipled by 100 as a percentage
    assert 100 in teros_data_obj["vwc"]
    assert 2 in teros_data_obj["raw_vwc"]
    assert 3 in teros_data_obj["temp"]
    assert 4 in teros_data_obj["ec"]
