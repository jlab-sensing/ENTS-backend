from datetime import datetime

from api.models.cell import Cell
from api.models.power_data import PowerData
from api.models.sensor import Sensor
from api.models.teros_data import TEROSData


def test_sensor_catalog_requires_cell_id(test_client, init_database):
    response = test_client.get("/api/catalog/sensors")
    assert response.status_code == 400
    assert response.get_json()["error"] == "cell_id parameter is required"


def test_sensor_catalog_returns_builtin_and_unified_entries(test_client, init_database):
    cell = Cell("catalog_cell", "", 1, 1, False, None)
    cell.save()

    PowerData.add_power_data("logger_catalog", "catalog_cell", datetime.now(), 1.0, 2.0)
    TEROSData.add_teros_data("catalog_cell", datetime.now(), 1, 2, 3, 4, 5)

    co2_sensor = Sensor(
        name="co2",
        measurement="co2",
        data_type="float",
        cell_id=cell.id,
        unit="ppm",
    )
    co2_sensor.save()

    response = test_client.get(f"/api/catalog/sensors?cell_id={cell.id}")
    assert response.status_code == 200

    payload = response.get_json()
    assert payload["cell_id"] == cell.id
    panel_ids = {entry["panel_id"] for entry in payload["entries"]}

    assert "power-vi" in panel_ids
    assert "power-p" in panel_ids
    assert "teros" in panel_ids
    assert "temp" in panel_ids
    assert "u:co2" in panel_ids


def test_sensor_catalog_empty_when_cell_has_no_data(test_client, init_database):
    cell = Cell("empty_catalog_cell", "", 1, 1, False, None)
    cell.save()

    response = test_client.get(f"/api/catalog/sensors?cell_id={cell.id}")
    assert response.status_code == 200
    assert response.get_json()["entries"] == []
