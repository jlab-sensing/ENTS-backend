"""Read-only sensor catalog for dashboard chart picker.

Builtin power/TEROS panels still come from legacy tables. Generic chartable
panels are discovered from the ``sensor`` table (name / measurement / unit
written at ingest via ``ents`` ``parse_sensor_measurement``).
"""

from flask import request
from flask_restful import Resource
from sqlalchemy import exists

from ..models.data import Data
from ..models.power_data import PowerData
from ..models.sensor import Sensor
from ..models.teros_data import TEROSData


_BUILTIN_SPECS = [
    {
        "panel_id": "power-vi",
        "label": "Voltage & Current",
        "description": "power · voltage & current",
        "category": "power",
        "kind": "builtin",
    },
    {
        "panel_id": "power-p",
        "label": "Power",
        "description": "power · µW",
        "category": "power",
        "kind": "builtin",
    },
    {
        "panel_id": "teros",
        "label": "VWC & EC",
        "description": "teros · volumetric water & conductivity",
        "category": "teros",
        "kind": "builtin",
    },
    {
        "panel_id": "temp",
        "label": "Temperature",
        "description": "teros · °C",
        "category": "teros",
        "kind": "builtin",
    },
]


def _has_power_data(cell_id: int) -> bool:
    return PowerData.query.filter_by(cell_id=cell_id).first() is not None


def _has_teros_data(cell_id: int) -> bool:
    return TEROSData.query.filter_by(cell_id=cell_id).first() is not None


def _sensors_with_data(cell_id: int) -> list[Sensor]:
    """Return sensors for a cell that have at least one data row."""
    has_data = exists().where(Data.sensor_id == Sensor.id)
    return (
        Sensor.query.filter(Sensor.cell_id == cell_id, has_data)
        .order_by(Sensor.name.asc(), Sensor.measurement.asc(), Sensor.id.asc())
        .all()
    )


def _entry_from_sensor(sensor: Sensor) -> dict:
    unit = sensor.unit or ""
    measurement = sensor.measurement or ""
    name = sensor.name or ""
    label = measurement or name or f"Sensor {sensor.id}"
    description_parts = [part for part in (name, measurement, unit) if part]
    return {
        "panel_id": f"s:{sensor.id}",
        "label": label,
        "description": " · ".join(description_parts) if description_parts else label,
        "category": "generic",
        "kind": "sensor",
        "sensor_id": sensor.id,
        "sensor_name": name,
        "measurement": measurement,
        "unit": unit,
    }


def _sensor_entries(cell_id: int) -> list[dict]:
    return [_entry_from_sensor(sensor) for sensor in _sensors_with_data(cell_id)]


class SensorCatalog(Resource):
    """GET /catalog/sensors?cell_id=<id> — chartable panels for dashboard picker."""

    def get(self):
        cell_id = request.args.get("cell_id", type=int)
        if cell_id is None:
            return {"error": "cell_id parameter is required"}, 400

        entries = []

        if _has_power_data(cell_id):
            entries.extend(
                [e for e in _BUILTIN_SPECS if e["panel_id"].startswith("power")]
            )

        if _has_teros_data(cell_id):
            entries.extend(
                [e for e in _BUILTIN_SPECS if e["panel_id"] in ("teros", "temp")]
            )

        entries.extend(_sensor_entries(cell_id))

        return {"cell_id": cell_id, "entries": entries}
