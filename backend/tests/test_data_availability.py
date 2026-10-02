from datetime import datetime, timedelta
from api.models.power_data import PowerData
from api.models.teros_data import TEROSData
from api.models.sensor import Sensor
from api.models.data import Data
from api.models.cell import Cell
from .test_apikey_auth import make_user, make_jwt_header


def test_data_availability_invalid_params(test_client, init_database):
    """
    GIVEN invalid request parameters
    WHEN hitting the data availability endpoint
    THEN it should return appropriate error messages
    """
    user = make_user(email="da-invalid-params@x.com", api_key="da-invalid-params-key")
    headers = make_jwt_header(user)

    # Test missing cell_ids
    response = test_client.get("/api/data-availability/", headers=headers)
    assert response.status_code == 400
    assert response.get_json()["error"] == "cell_ids parameter is required"

    # Test invalid cell_ids format
    response = test_client.get(
        "/api/data-availability/?cell_ids=invalid", headers=headers
    )
    assert response.status_code == 400
    assert response.get_json()["error"] == "Invalid cell_ids format"

    # Test empty cell_ids list
    response = test_client.get("/api/data-availability/?cell_ids=", headers=headers)
    assert response.status_code == 400
    assert response.get_json()["error"] == "At least one valid cell_id is required"


def test_data_availability_all_sources(test_client, init_database):
    """
    GIVEN a database with all types of data (Power, TEROS, Sensor)
    WHEN hitting the data availability endpoint
    THEN it should return correct timestamps and has_recent_data flag
    """
    user = make_user(email="da-all-sources@x.com", api_key="da-all-sources-key")

    # Create test cell (public by default)
    cell = Cell("test_cell_da", "", 1, 1, False, None)
    cell.save()

    # Create recent data (within last 14 days)
    recent_ts = datetime.now() - timedelta(days=7)

    # Add Power data
    power_data = PowerData.add_power_data(
        "test_logger", "test_cell_da", recent_ts, 1.0, 2.0
    )
    assert power_data is not None

    # Add TEROS data
    teros_data = TEROSData.add_teros_data("test_cell_da", recent_ts, 1, 2, 3, 4, 5)
    assert teros_data is not None

    # Add Sensor data
    sensor = Sensor(
        name="test_sensor",
        measurement="test",
        data_type="float",
        cell_id=cell.id,
        unit="test_unit",
    )
    sensor.save()
    data = Data(sensor_id=sensor.id, ts=recent_ts, float_val=1.0)
    data.save()

    # Test endpoint
    response = test_client.get(
        f"/api/data-availability/?cell_ids={cell.id}", headers=make_jwt_header(user)
    )
    assert response.status_code == 200
    data = response.get_json()
    assert data["has_recent_data"] is True
    assert data["latest_timestamp"] is not None
    assert data["earliest_timestamp"] is not None
    assert data["message"] == "success"


def test_data_availability_old_data(test_client, init_database):
    """
    GIVEN a database with only old data (>14 days)
    WHEN hitting the data availability endpoint
    THEN has_recent_data should be False
    """
    user = make_user(email="da-old-data@x.com", api_key="da-old-data-key")

    cell = Cell("test_cell_da_old", "", 1, 1, False, None)
    cell.save()

    old_ts = datetime.now() - timedelta(days=30)
    PowerData.add_power_data("test_logger", "test_cell_da_old", old_ts, 1.0, 2.0)

    response = test_client.get(
        f"/api/data-availability/?cell_ids={cell.id}", headers=make_jwt_header(user)
    )
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
    user = make_user(email="da-no-data@x.com", api_key="da-no-data-key")

    cell = Cell("test_cell_da_empty", "", 1, 1, False, None)
    cell.save()

    response = test_client.get(
        f"/api/data-availability/?cell_ids={cell.id}", headers=make_jwt_header(user)
    )
    assert response.status_code == 200

    json_data = response.get_json()
    assert json_data["latest_timestamp"] is None
    assert json_data["earliest_timestamp"] is None
    assert json_data["has_recent_data"] is False
    assert json_data["message"] == "No data found for specified cells"


def test_data_availability_public_cell_accessible_without_authorization(
    test_client, init_database
):
    """
    GIVEN a public cell the requesting user has no explicit access to
    WHEN hitting the data availability endpoint
    THEN the request should succeed
    """
    user = make_user(email="da-public-no-auth@x.com", api_key="da-public-no-auth-key")

    cell = Cell("test_cell_da_public", "", 1, 1, False, None, is_public=True)
    cell.save()

    response = test_client.get(
        f"/api/data-availability/?cell_ids={cell.id}", headers=make_jwt_header(user)
    )
    assert response.status_code == 200
    assert response.get_json()["message"] in (
        "success",
        "No data found for specified cells",
    )


def test_data_availability_private_cell_denied_without_authorization(
    test_client, init_database
):
    """
    GIVEN a private cell the requesting user has no access to
    WHEN hitting the data availability endpoint
    THEN the request should be denied with a 403
    """
    user = make_user(email="da-private-denied@x.com", api_key="da-private-denied-key")

    cell = Cell("test_cell_da_private_denied", "", 1, 1, False, None, is_public=False)
    cell.save()

    response = test_client.get(
        f"/api/data-availability/?cell_ids={cell.id}", headers=make_jwt_header(user)
    )
    assert response.status_code == 403
    assert response.get_json()["error"] == "No accessible cell_ids provided"


def test_data_availability_private_cell_allowed_with_authorization(
    test_client, init_database
):
    """
    GIVEN a private cell the requesting user has been granted access to
    WHEN hitting the data availability endpoint
    THEN the request should succeed
    """
    user = make_user(email="da-private-allowed@x.com", api_key="da-private-allowed-key")

    cell = Cell("test_cell_da_private_allowed", "", 1, 1, False, None, is_public=False)
    cell.save()
    cell.users.append(user)
    cell.save()

    response = test_client.get(
        f"/api/data-availability/?cell_ids={cell.id}", headers=make_jwt_header(user)
    )
    assert response.status_code == 200
    assert response.get_json()["message"] in (
        "success",
        "No data found for specified cells",
    )


def test_data_availability_mixed_request_filters_unauthorized_private_cell(
    test_client, init_database
):
    """
    GIVEN a mixed request containing a public cell, a private cell the user is
         authorized for, and a private cell the user is NOT authorized for
    WHEN hitting the data availability endpoint
    THEN only the public and authorized-private cells' data should be reflected
         in the response - the unauthorized private cell must be silently
         dropped, not grant access to the whole request nor deny it outright.
    """
    user = make_user(email="da-mixed-user@x.com", api_key="da-mixed-user-key")
    other_user = make_user(email="da-mixed-other@x.com", api_key="da-mixed-other-key")

    public_cell = Cell(
        "test_cell_da_mixed_public", "", 1, 1, False, None, is_public=True
    )
    public_cell.save()

    authorized_private_cell = Cell(
        "test_cell_da_mixed_authorized", "", 1, 1, False, None, is_public=False
    )
    authorized_private_cell.save()
    authorized_private_cell.users.append(user)
    authorized_private_cell.save()

    unauthorized_private_cell = Cell(
        "test_cell_da_mixed_unauthorized", "", 1, 1, False, None, is_public=False
    )
    unauthorized_private_cell.save()
    unauthorized_private_cell.users.append(other_user)
    unauthorized_private_cell.save()

    # Public + authorized cell get older data; the unauthorized cell gets the
    # most recent data so its inclusion would be obvious if the fix regressed.
    public_ts = datetime.now() - timedelta(days=7)
    authorized_ts = datetime.now() - timedelta(days=10)
    unauthorized_ts = datetime.now() - timedelta(days=1)

    PowerData.add_power_data(
        "test_logger", "test_cell_da_mixed_public", public_ts, 1.0, 2.0
    )
    PowerData.add_power_data(
        "test_logger", "test_cell_da_mixed_authorized", authorized_ts, 1.0, 2.0
    )
    PowerData.add_power_data(
        "test_logger", "test_cell_da_mixed_unauthorized", unauthorized_ts, 1.0, 2.0
    )

    requested_ids = (
        f"{public_cell.id},{authorized_private_cell.id},{unauthorized_private_cell.id}"
    )
    response = test_client.get(
        f"/api/data-availability/?cell_ids={requested_ids}",
        headers=make_jwt_header(user),
    )
    assert response.status_code == 200

    json_data = response.get_json()
    latest_timestamp = datetime.fromisoformat(json_data["latest_timestamp"])
    # The unauthorized private cell's (more recent) data must not be reflected -
    # the result should match the public cell's (older) timestamp instead.
    assert latest_timestamp < unauthorized_ts - timedelta(hours=1)
    assert abs(latest_timestamp - public_ts) < timedelta(seconds=5)

    # Requesting the unauthorized cell alone must still be denied.
    response = test_client.get(
        f"/api/data-availability/?cell_ids={unauthorized_private_cell.id}",
        headers=make_jwt_header(user),
    )
    assert response.status_code == 403
