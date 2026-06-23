"""Read-only sensor catalog for dashboard chart picker."""

from flask import request
from flask_restful import Resource

from ..models.power_data import PowerData
from ..models.sensor import Sensor
from ..models.teros_data import TEROSData


# Matches frontend UNIFIED_CATALOG + UnifiedChart CHART_CONFIGS
_UNIFIED_SPECS = [
    {
        "panel_id": "u:co2",
        "unified_type": "co2",
        "label": "CO₂",
        "description": "sensor · co2 · ppm",
        "category": "generic",
        "sensor_name": "co2",
        "measurements": ["co2"],
    },
    {
        "panel_id": "u:presHum",
        "unified_type": "presHum",
        "label": "Pressure & humidity",
        "description": "bme280 · pressure & humidity",
        "category": "generic",
        "sensor_name": "bme280",
        "measurements": ["pressure", "humidity"],
    },
    {
        "panel_id": "u:bme280Pressure",
        "unified_type": "bme280Pressure",
        "label": "BME280 pressure",
        "description": "bme280 · pressure",
        "category": "generic",
        "sensor_name": "bme280",
        "measurements": ["Pressure", "pressure"],
    },
    {
        "panel_id": "u:soilPot",
        "unified_type": "soilPot",
        "label": "Soil water potential",
        "description": "teros21 · matric potential",
        "category": "generic",
        "sensor_name": "teros21",
        "measurements": ["soil_water_potential"],
    },
    {
        "panel_id": "u:soilHum",
        "unified_type": "soilHum",
        "label": "Soil humidity",
        "description": "sen0308 · humidity",
        "category": "generic",
        "sensor_name": "sen0308",
        "measurements": ["humidity"],
    },
    {
        "panel_id": "u:waterPress",
        "unified_type": "waterPress",
        "label": "Water pressure",
        "description": "sen0257 · pressure",
        "category": "generic",
        "sensor_name": "sen0257",
        "measurements": ["pressure"],
    },
    {
        "panel_id": "u:waterFlow",
        "unified_type": "waterFlow",
        "label": "Water flow",
        "description": "yfs210c · flow",
        "category": "generic",
        "sensor_name": "yfs210c",
        "measurements": ["flow"],
    },
    {
        "panel_id": "u:sensor",
        "unified_type": "sensor",
        "label": "Dielectric permittivity",
        "description": "phytos31 · permittivity",
        "category": "generic",
        "sensor_name": "phytos31",
        "measurements": ["dielectric_permittivity"],
    },
    {
        "panel_id": "u:temperature",
        "unified_type": "temperature",
        "label": "Temperature (BME280)",
        "description": "bme280 · temperature",
        "category": "generic",
        "sensor_name": "bme280",
        "measurements": ["temperature", "Temperature"],
    },
]

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


def _unified_available(cell_id: int, spec: dict) -> bool:
    for measurement in spec["measurements"]:
        row = Sensor.query.filter_by(
            cell_id=cell_id,
            name=spec["sensor_name"],
            measurement=measurement,
        ).first()
        if row is not None:
            return True
    return False


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

        for spec in _UNIFIED_SPECS:
            if _unified_available(cell_id, spec):
                entries.append(
                    {
                        "panel_id": spec["panel_id"],
                        "label": spec["label"],
                        "description": spec["description"],
                        "category": spec["category"],
                        "kind": "unified",
                        "unified_type": spec["unified_type"],
                    }
                )

        return {"cell_id": cell_id, "entries": entries}
