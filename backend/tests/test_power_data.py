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
    formatedTS = datetime.fromtimestamp(ts)
    Logger("logger_1", None, "").save()
    Cell("cell_2", "", 1, 1, False, None).save()
    powerData = PowerData.add_power_data("logger_1", "cell_2", formatedTS, 1, 2)
    assert powerData.logger.name == "logger_1"
    assert powerData.cell.name == "cell_2"
    assert datetime.timestamp(powerData.ts) == 1705176162
    assert powerData.voltage == 1
    assert powerData.current == 2
