from datetime import datetime, timedelta, timezone
from email.utils import format_datetime

import pytest

from api import db
from api.models.cell import Cell
from api.models.data import Data
from api.models.logger import Logger
from api.models.power_data import PowerData
from api.models.sensor import Sensor
from api.models.teros_data import TEROSData
from api.resources.cell_statistics import _calculate_statistics


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


def rfc(ts):
    """Formats a naive UTC datetime like the frontend sends startTime/endTime."""
    return format_datetime(ts.replace(tzinfo=timezone.utc), usegmt=True)


def by_series(body):
    return {(s["source"], s["name"], s["measurement"]): s for s in body["statistics"]}


def test_calculate_statistics_without_values():
    assert _calculate_statistics([], []) == {
        "count": 0,
        "min": None,
        "max": None,
        "mean": None,
        "median": None,
        "std": None,
        "latest_value": None,
        "earliest_reading_ts": None,
        "latest_reading_ts": None,
    }


def test_calculate_statistics_skips_missing_values_and_sorts_by_time():
    t0 = datetime(2026, 1, 1, 0, 0)
    timestamps = [t0 + timedelta(hours=2), t0, t0 + timedelta(hours=1), t0]
    values = [3, 1, 2, None]

    stats = _calculate_statistics(timestamps, values)

    assert stats["count"] == 3
    assert stats["min"] == 1.0
    assert stats["max"] == 3.0
    assert stats["mean"] == 2.0
    assert stats["median"] == 2.0
    assert stats["std"] == 1.0
    assert stats["latest_value"] == 3.0
    assert stats["earliest_reading_ts"] == "2026-01-01T00:00:00"
    assert stats["latest_reading_ts"] == "2026-01-01T02:00:00"


def test_calculate_statistics_skips_non_finite_values():
    t0 = datetime(2026, 1, 1)
    timestamps = [t0, t0 + timedelta(hours=1), t0 + timedelta(hours=2)]
    values = [float("nan"), 4.0, float("inf")]

    stats = _calculate_statistics(timestamps, values)

    assert stats["count"] == 1
    assert stats["mean"] == 4.0
    assert stats["latest_value"] == 4.0
    assert stats["latest_reading_ts"] == "2026-01-01T01:00:00"


def test_calculate_statistics_single_value_has_zero_std():
    stats = _calculate_statistics([datetime(2026, 1, 1)], [5])

    assert stats["count"] == 1
    assert stats["std"] == 0.0
    assert stats["latest_value"] == 5.0


def test_cell_statistics_unknown_cell(test_client):
    response = test_client.get("/api/cell/999999/statistics")

    assert response.status_code == 404
    assert response.get_json() == {"message": "Cell not found"}


def test_cell_statistics_invalid_time(test_client):
    cell = Cell(name="stats_invalid_time", location="loc")
    cell.save()

    response = test_client.get(
        f"/api/cell/{cell.id}/statistics", query_string={"startTime": "yesterday"}
    )

    assert response.status_code == 400
    assert "startTime" in response.get_json()["message"]


def test_cell_statistics_without_data(test_client):
    cell = Cell(name="stats_empty", location="loc")
    cell.save()

    response = test_client.get(f"/api/cell/{cell.id}/statistics")

    assert response.status_code == 200
    body = response.get_json()
    assert body["cell_id"] == cell.id
    assert body["statistics"] == []


def test_cell_statistics_all_measurements_in_range(test_client):
    cell = Cell(name="stats_cell", location="loc")
    cell.save()
    Logger(name="stats_logger", type="rocketlogger").save()

    t0 = datetime(2026, 1, 10, 12, 0)
    t1 = t0 + timedelta(hours=1)
    outside = t0 - timedelta(days=30)

    PowerData.add_power_data("stats_logger", "stats_cell", t0, 0.5, 0.0001)
    PowerData.add_power_data("stats_logger", "stats_cell", t1, 0.7, 0.0003)
    PowerData.add_power_data("stats_logger", "stats_cell", outside, 9.0, 0.009)

    TEROSData.add_teros_data("stats_cell", t0, 20.0, 2000.0, 21.0, 100, -10.0)
    TEROSData.add_teros_data("stats_cell", t1, 30.0, 2100.0, 23.0, 300, -10.0)

    temp = Sensor(
        name="bme280",
        measurement="temperature",
        data_type="float",
        cell_id=cell.id,
        unit="C",
    )
    temp.save()
    Data(sensor_id=temp.id, ts=t0, float_val=18.0).save()
    Data(sensor_id=temp.id, ts=t1, float_val=22.0).save()

    moisture = Sensor(
        name="soil",
        measurement="counts",
        data_type="int",
        cell_id=cell.id,
        unit="",
    )
    moisture.save()
    Data(sensor_id=moisture.id, ts=t0, int_val=3).save()
    Data(sensor_id=moisture.id, ts=t1, int_val=5).save()

    label = Sensor(
        name="label", measurement="note", data_type="text", cell_id=cell.id, unit=""
    )
    label.save()
    Data(sensor_id=label.id, ts=t0, text_val="hello").save()

    response = test_client.get(
        f"/api/cell/{cell.id}/statistics",
        query_string={
            "startTime": rfc(t0 - timedelta(days=1)),
            "endTime": rfc(t1 + timedelta(days=1)),
        },
    )

    assert response.status_code == 200
    stats = by_series(response.get_json())

    assert list(stats) == [
        ("power", "power", "voltage"),
        ("power", "power", "current"),
        ("power", "power", "power"),
        ("teros12", "teros12", "vwc"),
        ("teros12", "teros12", "raw_vwc"),
        ("teros12", "teros12", "temp"),
        ("teros12", "teros12", "ec"),
        ("sensor", "bme280", "temperature"),
        ("sensor", "soil", "counts"),
    ]

    voltage = stats[("power", "power", "voltage")]
    assert voltage["unit"] == "mV"
    assert voltage["count"] == 2
    assert voltage["min"] == pytest.approx(500.0)
    assert voltage["max"] == pytest.approx(700.0)
    assert voltage["mean"] == pytest.approx(600.0)
    assert voltage["latest_value"] == pytest.approx(700.0)
    assert voltage["earliest_reading_ts"] == t0.isoformat()
    assert voltage["latest_reading_ts"] == t1.isoformat()

    current = stats[("power", "power", "current")]
    assert current["unit"] == "µA"
    assert current["mean"] == pytest.approx(200.0)

    power = stats[("power", "power", "power")]
    assert power["unit"] == "µW"
    assert power["min"] == pytest.approx(50.0)
    assert power["max"] == pytest.approx(210.0)

    assert stats[("teros12", "teros12", "vwc")]["unit"] == "%"
    assert stats[("teros12", "teros12", "vwc")]["mean"] == pytest.approx(25.0)
    assert stats[("teros12", "teros12", "raw_vwc")]["unit"] == "raw"
    assert stats[("teros12", "teros12", "raw_vwc")]["mean"] == pytest.approx(2050.0)
    assert stats[("teros12", "teros12", "temp")]["unit"] == "°C"
    assert stats[("teros12", "teros12", "temp")]["max"] == pytest.approx(23.0)
    assert stats[("teros12", "teros12", "ec")]["unit"] == "µS/cm"
    assert stats[("teros12", "teros12", "ec")]["median"] == pytest.approx(200.0)

    temperature = stats[("sensor", "bme280", "temperature")]
    assert temperature["unit"] == "C"
    assert temperature["count"] == 2
    assert temperature["std"] == pytest.approx(2.8284271)
    assert temperature["latest_value"] == pytest.approx(22.0)

    counts = stats[("sensor", "soil", "counts")]
    assert counts["count"] == 2
    assert counts["mean"] == pytest.approx(4.0)
    assert counts["latest_value"] == pytest.approx(5.0)


def test_cell_statistics_leaves_out_non_finite_readings(test_client):
    cell = Cell(name="stats_non_finite", location="loc")
    cell.save()
    sensor = Sensor(
        name="probe",
        measurement="level",
        data_type="float",
        cell_id=cell.id,
        unit="cm",
    )
    sensor.save()

    t0 = datetime(2026, 1, 10, 12, 0)
    for minutes, val in ((0, float("nan")), (10, 2.5), (20, float("inf"))):
        Data(
            sensor_id=sensor.id, ts=t0 + timedelta(minutes=minutes), float_val=val
        ).save()

    response = test_client.get(
        f"/api/cell/{cell.id}/statistics",
        query_string={"startTime": rfc(t0), "endTime": rfc(t0 + timedelta(hours=1))},
    )

    assert response.status_code == 200
    assert "NaN" not in response.get_data(as_text=True)
    assert "Infinity" not in response.get_data(as_text=True)
    level = by_series(response.get_json())[("sensor", "probe", "level")]
    assert level["count"] == 1
    assert level["mean"] == pytest.approx(2.5)


def test_cell_statistics_time_range_includes_its_start_and_end(test_client):
    cell = Cell(name="stats_tight_range", location="loc")
    cell.save()
    Logger(name="stats_tight_logger", type="rocketlogger").save()

    t0 = datetime(2026, 2, 1, 8, 0)
    t1 = t0 + timedelta(minutes=10)
    t2 = t1 + timedelta(minutes=10)
    for ts, v in ((t0, 0.1), (t1, 0.2), (t2, 0.3)):
        PowerData.add_power_data("stats_tight_logger", "stats_tight_range", ts, v, 0.0)

    response = test_client.get(
        f"/api/cell/{cell.id}/statistics",
        query_string={"startTime": rfc(t1), "endTime": rfc(t2)},
    )

    assert response.status_code == 200
    voltage = by_series(response.get_json())[("power", "power", "voltage")]
    assert voltage["count"] == 2
    assert voltage["min"] == pytest.approx(200.0)
    assert voltage["earliest_reading_ts"] == t1.isoformat()
    assert voltage["latest_reading_ts"] == t2.isoformat()


def test_cell_statistics_start_after_end(test_client):
    cell = Cell(name="stats_inverted_range", location="loc")
    cell.save()
    t0 = datetime(2026, 3, 1)

    response = test_client.get(
        f"/api/cell/{cell.id}/statistics",
        query_string={"startTime": rfc(t0), "endTime": rfc(t0 - timedelta(days=1))},
    )

    assert response.status_code == 400
    assert response.get_json() == {"message": "startTime must be before endTime"}


def test_cell_statistics_start_time_only(test_client):
    cell = Cell(name="stats_start_only", location="loc")
    cell.save()
    start = datetime(2026, 1, 1)

    response = test_client.get(
        f"/api/cell/{cell.id}/statistics", query_string={"startTime": rfc(start)}
    )

    assert response.status_code == 200
    body = response.get_json()
    start_time = datetime.fromisoformat(body["start_time"])
    end_time = datetime.fromisoformat(body["end_time"])
    assert start_time == start.replace(tzinfo=timezone.utc)
    assert end_time.tzinfo is not None
    assert start_time < end_time


def test_cell_statistics_minus_zero_time_zone_is_utc(test_client):
    cell = Cell(name="stats_minus_zero", location="loc")
    cell.save()

    response = test_client.get(
        f"/api/cell/{cell.id}/statistics",
        query_string={"startTime": "Sat, 10 Jan 2026 12:00:00 -0000"},
    )

    assert response.status_code == 200
    assert response.get_json()["start_time"] == "2026-01-10T12:00:00+00:00"


def test_cell_statistics_defaults_to_last_month(test_client):
    cell = Cell(name="stats_default_range", location="loc")
    cell.save()
    Logger(name="stats_default_logger", type="rocketlogger").save()

    now = datetime.now()
    PowerData.add_power_data(
        "stats_default_logger",
        "stats_default_range",
        now - timedelta(days=2),
        0.4,
        0.0002,
    )
    PowerData.add_power_data(
        "stats_default_logger",
        "stats_default_range",
        now - timedelta(days=45),
        0.9,
        0.0009,
    )

    response = test_client.get(f"/api/cell/{cell.id}/statistics")

    assert response.status_code == 200
    voltage = by_series(response.get_json())[("power", "power", "voltage")]
    assert voltage["count"] == 1
    assert voltage["latest_value"] == pytest.approx(400.0)
