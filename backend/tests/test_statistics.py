from datetime import datetime, timedelta
import pytest
from api import db
from api.models.cell import Cell
from api.models.logger import Logger
from api.models.sensor import Sensor
from api.models.data import Data
from api.models.power_data import PowerData
from api.models.teros_data import TEROSData


@pytest.fixture(autouse=True)
def clean_tables_per_test(init_database):
    """Clean test rows between test runs without dropping table schemas."""
    yield
    db.session.query(Data).delete()
    db.session.query(Sensor).delete()
    db.session.query(PowerData).delete()
    db.session.query(TEROSData).delete()
    db.session.query(Logger).delete()
    db.session.query(Cell).delete()
    db.session.commit()


def test_statistics_empty_db(test_client, init_database):
    """GIVEN an empty database
    WHEN requesting /api/statistics/
    THEN it should return all zeros and None for timestamp
    """
    response = test_client.get("/api/statistics/")
    assert response.status_code == 200
    data = response.get_json()

    assert data["total_cells"] == 0
    assert data["active_cells"] == 0
    assert data["archived_cells"] == 0
    assert data["total_sites"] == 0
    assert data["total_loggers"] == 0
    assert data["total_sensors"] == 0
    assert data["total_data_points"] == 0
    assert data["total_uploads"] == 0
    assert data["upload_error_rate"] == 0.0
    assert data["upload_success_rate"] == 100.0
    assert data["latest_timestamp"] is None
    assert data["data_breakdown"] == {"power": 0, "teros": 0, "generic": 0}


def test_statistics_populated_db(test_client, init_database):
    """GIVEN a populated database with cells, loggers, power, teros, and sensor data
    WHEN requesting /api/statistics/ or /api/stats/
    THEN it should return accurate aggregated statistics
    """
    # Create active cell
    active_cell = Cell(name="cell_active", location="loc1", archive=False)
    active_cell.save()

    # Create archived cell
    archived_cell = Cell(name="cell_archived", location="loc2", archive=True)
    archived_cell.save()

    # Create logger
    logger = Logger(name="logger_1", type="rocketlogger")
    logger.save()

    # Create data timestamps
    now = datetime.utcnow()
    earlier = now - timedelta(hours=1)

    # Add Power data
    PowerData.add_power_data("logger_1", "cell_active", earlier, 3.3, 0.05)

    # Add TEROS data
    TEROSData.add_teros_data("cell_active", now, 25.0, 1500.0, 20.0, 100, -10.0)

    # Add Generic Sensor data
    sensor = Sensor(
        name="temp_sensor",
        measurement="temperature",
        data_type="float",
        cell_id=active_cell.id,
        unit="C",
    )
    sensor.save()
    generic_data = Data(sensor_id=sensor.id, ts=earlier, float_val=22.5)
    generic_data.save()

    # Request /api/statistics/
    response = test_client.get("/api/statistics/")
    assert response.status_code == 200
    data = response.get_json()

    assert data["total_cells"] == 2
    assert data["active_cells"] == 1
    assert data["archived_cells"] == 1
    assert data["total_sites"] == 2
    assert data["total_loggers"] == 1
    assert data["total_sensors"] == 1
    assert data["total_data_points"] == 3
    assert data["total_uploads"] == 3
    assert data["upload_error_rate"] == 0.0
    assert data["upload_success_rate"] == 100.0
    assert data["data_breakdown"]["power"] == 1
    assert data["data_breakdown"]["teros"] == 1
    assert data["data_breakdown"]["generic"] == 1
    assert data["latest_timestamp"] is not None

    # Verify /api/stats/ alias works identically
    alias_response = test_client.get("/api/stats/")
    assert alias_response.status_code == 200
    assert alias_response.get_json() == data


def test_statistics_sites_deduplicates_locations(test_client, init_database):
    """GIVEN cells with duplicate location values
    WHEN requesting /api/statistics/
    THEN total_sites should count only distinct non-empty locations
    """
    # Two cells at same location
    cell1 = Cell(name="cell_a", location="farm_field_1", archive=False)
    cell1.save()
    cell2 = Cell(name="cell_b", location="farm_field_1", archive=False)
    cell2.save()

    # One cell at a different location
    cell3 = Cell(name="cell_c", location="lab_bench", archive=False)
    cell3.save()

    response = test_client.get("/api/statistics/")
    data = response.get_json()

    assert data["total_cells"] == 3
    assert data["total_sites"] == 2  # farm_field_1 and lab_bench


def test_statistics_sites_ignores_empty_locations(test_client, init_database):
    """GIVEN cells with empty or None locations
    WHEN requesting /api/statistics/
    THEN total_sites should exclude them
    """
    cell1 = Cell(name="cell_empty", location="", archive=False)
    cell1.save()

    cell2 = Cell(name="cell_none", location=None, archive=False)
    cell2.save()

    cell3 = Cell(name="cell_valid", location="greenhouse", archive=False)
    cell3.save()

    response = test_client.get("/api/statistics/")
    data = response.get_json()

    assert data["total_cells"] == 3
    assert data["total_sites"] == 1  # only "greenhouse"


def test_statistics_only_active_cells_counted(test_client, init_database):
    """GIVEN a mix of active and archived cells
    WHEN requesting /api/statistics/
    THEN active_cells and archived_cells should be correct
    """
    Cell(name="active_1", location="loc", archive=False).save()
    Cell(name="active_2", location="loc", archive=False).save()
    Cell(name="archived_1", location="loc", archive=True).save()

    response = test_client.get("/api/statistics/")
    data = response.get_json()

    assert data["total_cells"] == 3
    assert data["active_cells"] == 2
    assert data["archived_cells"] == 1


def test_statistics_latest_timestamp_picks_most_recent(test_client, init_database):
    """GIVEN data across multiple tables with different timestamps
    WHEN requesting /api/statistics/
    THEN latest_timestamp should be the most recent across all tables
    """
    cell = Cell(name="ts_cell", location="loc", archive=False)
    cell.save()

    logger = Logger(name="ts_logger", type="rocketlogger")
    logger.save()

    old_time = datetime(2024, 1, 1, 12, 0, 0)
    new_time = datetime(2025, 6, 15, 18, 30, 0)

    # Power data with older timestamp
    PowerData.add_power_data("ts_logger", "ts_cell", old_time, 3.3, 0.05)

    # TEROS data with newer timestamp
    TEROSData.add_teros_data("ts_cell", new_time, 25.0, 1500.0, 20.0, 100, -10.0)

    response = test_client.get("/api/statistics/")
    data = response.get_json()

    assert data["latest_timestamp"] is not None
    ts = datetime.fromisoformat(data["latest_timestamp"])
    assert ts.year == 2025
    assert ts.month == 6
