from api.resources.util import process_measurement_dict
from datetime import datetime
from unittest.mock import patch
from api.models.logger import Logger
from api.models.cell import Cell


def test_process_measurement_dict_power_success(init_database):
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
        call_args = mock_socketio.emit.call_args
        assert call_args[0][0] == "measurement_received"

        emitted_data = call_args[0][1]
        assert emitted_data["type"] == "power"
        assert emitted_data["cellId"] == cell.id
        assert emitted_data["loggerId"] == logger.id
        assert "obj_count" in emitted_data
        assert emitted_data["obj_count"] == 1


def test_process_measurement_dict_teros12_success(init_database):
    cell = Cell("test_cell_teros", "", 1, 1, False, None)
    cell.save()

    measurement = {
        "type": "teros12",
        "loggerId": 1,
        "cellId": cell.id,
        "ts": datetime.now().timestamp(),
        "data": {"vwcAdj": 0.35, "vwcRaw": 0.32, "temp": 22.5, "ec": 450},
    }

    with patch("api.resources.util.socketio") as mock_socketio:
        response = process_measurement_dict(measurement)

        assert response.status_code == 200

        assert mock_socketio.emit.called
        call_args = mock_socketio.emit.call_args

        emitted_data = call_args[0][1]
        assert emitted_data["type"] == "teros12"
        assert emitted_data["cellId"] == cell.id


def test_process_measurement_dict_websocket_error_handling(init_database):
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
        mock_socketio.emit.side_effect = Exception("WebSocket connection failed")

        response = process_measurement_dict(measurement)
        assert response.status_code == 200


def test_process_measurement_dict_bme280_multi_sensor(init_database):
    cell = Cell("test_cell_bme", "", 1, 1, False, None)
    cell.save()

    measurement = {
        "type": "bme280",
        "loggerId": 1,
        "cellId": cell.id,
        "ts": datetime.now().timestamp(),
        "data": {"pressure": 101.3, "temperature": 23.5, "humidity": 65.0},
    }

    with patch("api.resources.util.socketio") as mock_socketio:
        response = process_measurement_dict(measurement)

        assert response.status_code == 200

        assert mock_socketio.emit.called

        emitted_data = mock_socketio.emit.call_args[0][1]
        assert emitted_data["type"] == "bme280"
        assert emitted_data["obj_count"] == 3


def test_process_measurement_dict_unknown_type(init_database):
    measurement = {
        "type": "unknown_sensor_type",
        "loggerId": 1,
        "cellId": 1,
        "ts": datetime.now().timestamp(),
        "data": {},
    }

    with patch("api.resources.util.socketio"):
        response = process_measurement_dict(measurement)

        assert response.status_code == 501


def test_process_measurement_dict_teros21(init_database):
    cell = Cell("test_cell_t21", "", 1, 1, False, None)
    cell.save()

    measurement = {
        "type": "teros21",
        "loggerId": 1,
        "cellId": cell.id,
        "ts": datetime.now().timestamp(),
        "data": {"matricPot": -10.5, "temp": 21.0},
    }

    with patch("api.resources.util.socketio") as mock_socketio:
        response = process_measurement_dict(measurement)

        assert response.status_code == 200

        emitted_data = mock_socketio.emit.call_args[0][1]
        assert emitted_data["type"] == "teros21"
        assert emitted_data["obj_count"] == 2


def test_process_measurement_dict_co2(init_database):
    cell = Cell("test_cell_co2", "", 1, 1, False, None)
    cell.save()

    measurement = {
        "type": "co2",
        "loggerId": 1,
        "cellId": cell.id,
        "ts": datetime.now().timestamp(),
        "data": {"CO2": 420, "state": True, "Photoresistivity": 10000},
    }

    with patch("api.resources.util.socketio") as mock_socketio:
        response = process_measurement_dict(measurement)

        assert response.status_code == 200

        emitted_data = mock_socketio.emit.call_args[0][1]
        assert emitted_data["type"] == "co2"
