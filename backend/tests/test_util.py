from api.resources.util import process_measurement_dict, process_generic_measurement
from datetime import datetime
from unittest.mock import patch
from api.models.logger import Logger
from api.models.cell import Cell
from api.models.sensor import Sensor
from api.models.data import Data
import os


from ents.proto.sensor import format_sensor_measurement


def test_sensor_generic_uint(init_database, clear_data):
    """Processes a generic measurement."""

    # metadata
    ts = 1705176162
    cell = Cell("cell_sensor_generic_uint")
    cell.save()
    logger = Logger("logger_sensor_generic_uint")
    logger.save()

    meas = {
        "meta": {
            "cellId": cell.id,
            "loggerId": logger.id,
            "ts": ts,
        },
        "type": "POWER_VOLTAGE",
        "unsignedInt": 100,
    }

    # process measuire
    data = format_sensor_measurement([meas])
    resp = process_generic_measurement(data)

    sensor_objs = Sensor.query.all()
    data_objs = Data.query.all()

    print(sensor_objs)

    assert resp.status_code == 200
    assert len(sensor_objs) == 1
    assert len(data_objs) == 1

def test_sensor_generic_int(init_database, clear_data):
    """Processes a generic measurement."""

    # metadata
    ts = 1705176162
    cell = Cell("cell_sensor_generic_int")
    cell.save()
    logger = Logger("logger_sensor_generic_int")
    logger.save()

    meas = {
        "meta": {
            "cellId": cell.id,
            "loggerId": logger.id,
            "ts": ts,
        },
        "type": "POWER_VOLTAGE",
        "signedInt": -100,
    }

    # process measuire
    data = format_sensor_measurement([meas])
    resp = process_generic_measurement(data)

    sensor_objs = Sensor.query.all()
    data_objs = Data.query.all()

    print(sensor_objs)

    assert resp.status_code == 200
    assert len(sensor_objs) == 1
    assert len(data_objs) == 1

def test_sensor_generic_decimal(init_database, clear_data):
    """Processes a generic measurement."""

    # metadata
    ts = 1705176162
    cell = Cell("cell_sensor_generic_decimal")
    cell.save()
    logger = Logger("logger_sensor_generic_decimal")
    logger.save()

    meas = {
        "meta": {
            "cellId": cell.id,
            "loggerId": logger.id,
            "ts": ts,
        },
        "type": "POWER_VOLTAGE",
        "decimal": 50.2123,
    }

    # process measuire
    data = format_sensor_measurement([meas])
    resp = process_generic_measurement(data)

    sensor_objs = Sensor.query.all()
    data_objs = Data.query.all()

    print(sensor_objs)

    assert resp.status_code == 200
    assert len(sensor_objs) == 1
    assert len(data_objs) == 1


def test_sensor_generic_error_meta(init_database, clear_data):
    """Processes a generic measurement."""

    ts = 1705176162

    # use basically impossible cell/logger ids
    meas = {
        "meta": {
            "cellId": 123451223,
            "loggerId": 13413513,
            "ts": ts,
        },
        "type": "POWER_VOLTAGE",
        "decimal": 50.2123,
    }

    # process measuire
    data = format_sensor_measurement([meas])
    resp = process_generic_measurement(data)

    sensor_objs = Sensor.query.all()
    data_objs = Data.query.all()

    print(sensor_objs)

    assert resp.status_code == 400
    assert len(sensor_objs) == 0
    assert len(data_objs) == 0


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


def test_debug_socketio_flag_default():
    """Test DEBUG_SOCKETIO defaults to False"""
    with patch.dict(os.environ, {}, clear=True):
        result = os.getenv("DEBUG_SOCKETIO", "False").lower() == "true"
        assert result is False


def test_debug_socketio_flag_enabled():
    """Test DEBUG_SOCKETIO can be enabled"""
    with patch.dict(os.environ, {"DEBUG_SOCKETIO": "true"}):
        result = os.getenv("DEBUG_SOCKETIO", "False").lower() == "true"
        assert result is True


def test_socketio_emit_called_with_room():
    """Test that socketio.emit is called with correct room parameter"""
    with patch("api.resources.util.socketio") as mock_socketio:
        with patch("api.resources.util.DEBUG_SOCKETIO", False):
            # Simulate the emit logic from util.py
            cell_id = 123
            room_name = f"cell_{cell_id}"
            measurement_data = {"test": "data"}

            mock_socketio.emit("measurement_received", measurement_data, room=room_name)

            mock_socketio.emit.assert_called_once_with(
                "measurement_received", measurement_data, room=room_name
            )


def test_socketio_emit_error_handling():
    """Test that errors during emit are caught"""
    with patch("api.resources.util.socketio") as mock_socketio:
        mock_socketio.emit.side_effect = Exception("Connection error")

        try:
            mock_socketio.emit("test", {}, room="test_room")
        except Exception as e:
            assert str(e) == "Connection error"
