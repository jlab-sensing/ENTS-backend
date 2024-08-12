from api.models.power_data import PowerData
from api.models.cell import Cell
from api.models.logger import Logger
from datetime import datetime


def test_new_power_data(init_database):
    """
    GIVEN a Power Data model
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

    # #     "ts": 1705176162,
    # "cell": "dummy",
    # "vwc": 1,
    # "raw_vwc": 1,
    # "temp": 1,
    # "ec": 1,
    # "water_pot": 1


#     id = db.Column(db.Integer, primary_key=True)
#     logger_id = db.Column(db.Integer, db.ForeignKey("logger.id"))
#     cell_id = db.Column(
#         db.Integer, db.ForeignKey("cell.id", ondelete="CASCADE"), nullable=False
#     )
#     ts = db.Column(db.DateTime, nullable=False, index=True)
#     ts_server = db.Column(db.DateTime, server_default=db.func.now(), index=True)
#     current = db.Column(db.Float)
#     voltage = db.Column(db.Float)

#   def add_power_data(logger_name, cell_name, ts, v, i):

# json_data = request.json
# power_data_obj = p_in.load(json_data)
# logger_name = power_data_obj["logger"]
# cell_name = power_data_obj["cell"]
# ts = datetime.fromtimestamp(json_data["ts"])
# voltage = power_data_obj["v"]
# current = power_data_obj["i"]
# new_pwr_data = PowerData.add_power_data(
#     logger_name, cell_name, ts, voltage, current
# )
# return power_schema.jsonify(new_pwr_data)
