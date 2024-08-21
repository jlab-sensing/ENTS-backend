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
    formatedTS = datetime.fromtimestamp(ts)
    Cell("cell_2", "", 1, 1, False, None).save()
    terosData = TEROSData.add_teros_data("cell_2", formatedTS, 1, 2, 3, 4, 5)
    assert terosData.cell.name == "cell_2"
    assert datetime.timestamp(terosData.ts) == 1705176162
    assert terosData.vwc == 1
    assert terosData.raw_vwc == 2
    assert terosData.temp == 3
    assert terosData.ec == 4
    assert terosData.water_pot == 5


def test_new_teros_data_cell_creation(init_database):
    """
    GIVEN a TEROS Data arguments
    WHEN a new TEROS Data is created
    THEN check the vwc, raw vwc, temp, ec, water potential is defined correctly
    """
    ts = 1705176162
    formatedTS = datetime.fromtimestamp(ts)
    Logger("logger_1", None, "").save()
    # Cell("cell_2", "", 1, 1, False, None).save()
    terosData = TEROSData.add_teros_data("cell_3", formatedTS, 1, 2, 3, 4, 5)
    assert terosData.cell.name == "cell_3"
    print(terosData.cell_id)
    cell = Cell.get(terosData.cell_id)
    assert cell


def test_new_teros_protobuf_data(init_database):
    """
    GIVEN a TEROS Data arguments
    WHEN a new TEROS Data is created
    THEN check the vwc, raw vwc, temp, ec, water potential is defined correctly
    """
    ts = 1705176162
    formatedTS = datetime.fromtimestamp(ts)
    cell = Cell("cell_4", "", 1, 1, False, None)
    cell.save()
    terosData = TEROSData.add_protobuf_teros_data(cell.id, formatedTS, 1, 2, 3, 4, 5)
    assert terosData.cell.name == "cell_4"
    assert datetime.timestamp(terosData.ts) == 1705176162
    assert terosData.vwc == 1
    assert terosData.raw_vwc == 2
    assert terosData.temp == 3
    assert terosData.ec == 4
    assert terosData.water_pot == 5


def test_get_teros_obj(init_database):
    """
    GIVEN a TEROS Data arguments
    WHEN a new TEROS Data is created
    THEN check the vwc, raw vwc, temp, ec, water potential is defined correctly
    """
    ts = 1705176162
    formatedTS = datetime.fromtimestamp(ts)
    cell = Cell("cell_6", "", 1, 1, False, None)
    cell.save()
    TEROSData.add_teros_data("cell_6", formatedTS, 1, 2, 3, 4, 5)
    terosDataObj = TEROSData.get_teros_data_obj(
        cell.id, "none", formatedTS, formatedTS, False
    )
    datetime.fromtimestamp(ts).replace(minute=0, second=0, tzinfo=None)
    assert formatedTS in terosDataObj["timestamp"]
    # decimal multipled by 100 as a percentage
    assert 100 in terosDataObj["vwc"]
    assert 2 in terosDataObj["raw_vwc"]
    assert 3 in terosDataObj["temp"]
    assert 4 in terosDataObj["ec"]


def test_get_teros_obj_hour(init_database):
    """
    GIVEN a TEROS Data arguments
    WHEN a new TEROS Data is created
    THEN check the vwc, raw vwc, temp, ec, water potential is defined correctly
    """
    ts = 1705176162
    formatedTS = datetime.fromtimestamp(ts)
    cell = Cell("cell_5", "", 1, 1, False, None)
    cell.save()
    TEROSData.add_teros_data("cell_5", formatedTS, 1, 2, 3, 4, 5)
    terosDataObj = TEROSData.get_teros_data_obj(
        cell.id, "hour", formatedTS, formatedTS, False
    )
    # splice out minutes
    formatedTS = datetime.fromtimestamp(ts).replace(minute=0, second=0, tzinfo=None)
    assert formatedTS in terosDataObj["timestamp"]
    # decimal multipled by 100 as a percentage
    assert 100 in terosDataObj["vwc"]
    assert 2 in terosDataObj["raw_vwc"]
    assert 3 in terosDataObj["temp"]
    assert 4 in terosDataObj["ec"]
