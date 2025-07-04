from api.models.power_data import PowerData
from api.models.teros_data import TEROSData
from api.models.sensor import Sensor
from api.models.data import Data
from api.models.cell import Cell
from datetime import datetime, timedelta


def test_data_availability_all_sources(test_client, init_database):
    """
    GIVEN a database with all types of data (Power, TEROS, Sensor)
    WHEN hitting the data availability endpoint
    THEN it should return correct timestamps and has_recent_data flag
    """
    # Create test cell
    cell = Cell("test_cell_da", "", 1, 1, False, None)
    cell.save()
    
    # Create recent data (within last 14 days)
    recent_ts = datetime.now() - timedelta(days=7)
    
    # Add Power data
    power_data = PowerData.add_power_data("test_logger", "test_cell_da", recent_ts, 1.0, 2.0)
    assert power_data is not None
    
    # Add TEROS data
    teros_data = TEROSData.add_teros_data("test_cell_da", recent_ts, 1, 2, 3, 4, 5)
    assert teros_data is not None
    
    # Add Sensor data
    sensor = Sensor("test_sensor", "test", "float", cell.id)
    sensor.save()
    data = Data(sensor_id=sensor.id, ts=recent_ts, float_val=1.5)
    data.save()
    
    # Test endpoint
    response = test_client.get(f"/api/data-availability/?cell_ids={cell.id}")
    assert response.status_code == 200
    
    json_data = response.get_json()
    assert isinstance(json_data["latest_timestamp"], str)
    assert isinstance(json_data["earliest_timestamp"], str)
    assert json_data["has_recent_data"] is True
    assert json_data["message"] == "success"


def test_data_availability_old_data(test_client, init_database):
    """
    GIVEN a database with only old data (>14 days)
    WHEN hitting the data availability endpoint
    THEN has_recent_data should be False
    """
    cell = Cell("test_cell_da_old", "", 1, 1, False, None)
    cell.save()
    
    old_ts = datetime.now() - timedelta(days=30)
    PowerData.add_power_data("test_logger", "test_cell_da_old", old_ts, 1.0, 2.0)
    
    response = test_client.get(f"/api/data-availability/?cell_ids={cell.id}")
    assert response.status_code == 200
    
    json_data = response.get_json()
    assert json_data["has_recent_data"] is False
    assert json_data["latest_timestamp"] is not None
    assert json_data["earliest_timestamp"] is not None
    assert json_data["message"] == "success"


def test_data_availability_no_data(test_client, init_database):
    """
    GIVEN a database with no data for cell
    WHEN hitting the data availability endpoint
    THEN it should return null timestamps
    """
    cell = Cell("test_cell_da_empty", "", 1, 1, False, None)
    cell.save()
    
    response = test_client.get(f"/api/data-availability/?cell_ids={cell.id}")
    assert response.status_code == 200
    
    json_data = response.get_json()
    assert json_data["latest_timestamp"] is None
    assert json_data["earliest_timestamp"] is None
    assert json_data["has_recent_data"] is False
    assert json_data["message"] == "No data found for specified cells"


def test_data_availability_invalid_params(test_client, init_database):
    """
    GIVEN invalid request parameters
    WHEN hitting the data availability endpoint
    THEN it should return appropriate error messages
    """
    # Test missing cell_ids
    response = test_client.get("/api/data-availability/")
    assert response.status_code == 400
    assert response.get_json()["error"] == "cell_ids parameter is required"
    
    # Test invalid cell_ids format
    response = test_client.get("/api/data-availability/?cell_ids=invalid")
    assert response.status_code == 400
    assert response.get_json()["error"] == "Invalid cell_ids format"
    
    # Test empty cell_ids list
    response = test_client.get("/api/data-availability/?cell_ids=")
    assert response.status_code == 400
    assert response.get_json()["error"] == "At least one valid cell_id is required" 