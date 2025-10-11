from api.resources.util import process_measurement_dict
from datetime import datetime
from unittest.mock import patch
from api.models.logger import Logger
from api.models.cell import Cell


def test_process_measurement_dict_power_with_websocket(init_database):
    logger = Logger("test_logger_ws", None, "")
    logger.save()
    cell = Cell("test_cell_ws", "", 1, 1, False, None)
    cell.save()

    measurement = {
        "type": "power",
        "loggerId": logger.id,
        "cellId": cell.id,
        "ts": datetime.now().timestamp(),
        "data": {"voltage": 3.3, "current": 0.5},
    }

    with patch("api.resources.util.socketio") as mock_socketio:
        response = process_measurement_dict(measurement)

        assert response.status_code == 200
        assert mock_socketio.emit.called
        # Verify room-based emission
        call_args = mock_socketio.emit.call_args
        assert call_args[0][0] == "measurement_received"  # Event name
        assert call_args[1]["room"] == f"cell_{cell.id}"  # Room parameter


def test_process_measurement_dict_websocket_exception(init_database):
    logger = Logger("test_logger_err", None, "")
    logger.save()
    cell = Cell("test_cell_err", "", 1, 1, False, None)
    cell.save()

    measurement = {
        "type": "power",
        "loggerId": logger.id,
        "cellId": cell.id,
        "ts": datetime.now().timestamp(),
        "data": {"voltage": 3.3, "current": 0.5},
    }

    with patch("api.resources.util.socketio") as mock_socketio:
        mock_socketio.emit.side_effect = Exception("WebSocket error")
        response = process_measurement_dict(measurement)
        assert response.status_code == 200
