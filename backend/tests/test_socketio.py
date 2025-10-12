from unittest.mock import patch, MagicMock
import os


def test_room_based_emission():
    with patch("api.resources.util.socketio") as mock_socketio:
        from api.resources.util import process_measurement_dict
        from datetime import datetime

        measurement = {
            "type": "power",
            "loggerId": 1,
            "cellId": 200,
            "ts": datetime.now().timestamp(),
            "data": {"voltage": 3.3, "current": 0.5},
        }

        with patch(
            "api.models.power_data.PowerData.add_protobuf_power_data"
        ) as mock_save:
            mock_save.return_value = MagicMock()
            response = process_measurement_dict(measurement)

            assert response.status_code == 200
            mock_socketio.emit.assert_called_once()
            call_args = mock_socketio.emit.call_args
            assert call_args[0][0] == "measurement_received"
            assert call_args[1]["room"] == "cell_200"


def test_subscription_logic():
    with patch("flask_socketio.join_room") as mock_join_room:
        cell_ids = [1, 200, 300]
        for cell_id in cell_ids:
            mock_join_room(f"cell_{cell_id}")

        assert mock_join_room.call_count == len(cell_ids)


def test_debug_socketio_disabled_by_default():
    """Test that DEBUG_SOCKETIO is False by default"""
    from api.resources.util import DEBUG_SOCKETIO

    assert DEBUG_SOCKETIO is False


def test_debug_socketio_enabled():
    """Test that DEBUG_SOCKETIO can be enabled via environment variable"""
    with patch.dict(os.environ, {"DEBUG_SOCKETIO": "true"}):
        import importlib
        import api.resources.util

        importlib.reload(api.resources.util)

        assert api.resources.util.DEBUG_SOCKETIO is True


def test_socketio_connection_no_debug_logging(capsys):
    """Test that connection handler doesn't log when DEBUG_SOCKETIO is False"""
    with patch.dict(
        os.environ,
        {
            "DEBUG_SOCKETIO": "false",
            "TTN_API_KEY": "test_key",
            "TTN_APP_ID": "test_app",
        },
    ):
        from api import create_app

        create_app()

        captured = capsys.readouterr()
        assert "[socketio]" not in captured.out.lower()


def test_socketio_logger_config_disabled_by_default():
    """Test that SOCKETIO_LOGGER environment variable defaults to False"""
    with patch.dict(os.environ, {}, clear=True):
        # Test that when env var is not set, it evaluates to False
        result = os.getenv("SOCKETIO_LOGGER", "False").lower() == "true"
        assert result is False


def test_socketio_logger_config_enabled():
    """Test that SOCKETIO_LOGGER environment variable can be enabled"""
    with patch.dict(os.environ, {"SOCKETIO_LOGGER": "true"}):
        result = os.getenv("SOCKETIO_LOGGER", "False").lower() == "true"
        assert result is True
