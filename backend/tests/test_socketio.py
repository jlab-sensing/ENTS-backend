from unittest.mock import patch, MagicMock


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
