"""Summary statistics for the measurements of a cell"""

import statistics

from datetime import datetime, timezone

from dateutil.relativedelta import relativedelta
from flask import request
from flask_restful import Resource
from marshmallow import ValidationError

from ..models.cell import Cell as CellModel
from ..models.power_data import PowerData
from ..models.sensor import Sensor
from ..models.teros_data import TEROSData
from ..schemas.get_cell_statistics_schema import GetCellStatisticsSchema

get_cell_statistics_schema = GetCellStatisticsSchema()


def _calculate_statistics(timestamps: list, values: list) -> dict:
    """Calculate summary statistics from paired timestamps and measurement values."""
    valid_pairs = [
        (ts, float(val)) for ts, val in zip(timestamps, values) if val is not None
    ]
    if not valid_pairs:
        return {
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

    # Ensure chronological order
    valid_pairs.sort(key=lambda p: p[0])

    vals = [p[1] for p in valid_pairs]
    count = len(vals)
    min_val = min(vals)
    max_val = max(vals)
    mean_val = statistics.mean(vals)
    median_val = statistics.median(vals)
    std_val = statistics.stdev(vals) if count > 1 else 0.0

    earliest_ts = valid_pairs[0][0]
    latest_ts = valid_pairs[-1][0]
    latest_val = valid_pairs[-1][1]

    earliest_str = (
        earliest_ts.isoformat()
        if hasattr(earliest_ts, "isoformat")
        else str(earliest_ts)
    )
    latest_str = (
        latest_ts.isoformat() if hasattr(latest_ts, "isoformat") else str(latest_ts)
    )

    return {
        "count": count,
        "min": min_val,
        "max": max_val,
        "mean": mean_val,
        "median": median_val,
        "std": std_val,
        "latest_value": latest_val,
        "earliest_reading_ts": earliest_str,
        "latest_reading_ts": latest_str,
    }


class Cell_Statistics(Resource):
    def get(self, cell_id):
        """Get summary statistics for every numeric measurement of a cell

        Statistics are calculated from the raw readings between startTime and
        endTime (default: the last month), in the same units as the dashboard
        charts. Measurements without readings in that range are left out.
        "source" says where a series is stored: power, teros12 or sensor.
        """
        if not CellModel.get(cell_id):
            return {"message": "Cell not found"}, 404

        try:
            v_args = get_cell_statistics_schema.load(request.args)
        except ValidationError as err:
            return {"message": err.messages}, 400

        # an RFC time zone of "-0000" parses as a naive time; it means UTC
        for key in ("startTime", "endTime"):
            if key in v_args and v_args[key].tzinfo is None:
                v_args[key] = v_args[key].replace(tzinfo=timezone.utc)

        end_time = v_args.get("endTime", datetime.now(timezone.utc))
        start_time = v_args.get("startTime", end_time - relativedelta(months=1))
        if start_time > end_time:
            return {"message": "startTime must be before endTime"}, 400

        series = []

        power = PowerData.get_power_data_obj(
            cell_id, resample="none", start_time=start_time, end_time=end_time
        )
        for measurement, key, unit in (
            ("voltage", "v", "mV"),
            ("current", "i", "µA"),
            ("power", "p", "µW"),
        ):
            series.append(
                ("power", "power", measurement, unit, power["timestamp"], power[key])
            )

        teros = TEROSData.get_teros_data_obj(
            cell_id, resample="none", start_time=start_time, end_time=end_time
        )
        for measurement, unit in (("vwc", "%"), ("temp", "°C"), ("ec", "µS/cm")):
            series.append(
                (
                    "teros12",
                    "teros12",
                    measurement,
                    unit,
                    teros["timestamp"],
                    teros[measurement],
                )
            )

        sensors = (
            Sensor.query.filter(
                Sensor.cell_id == cell_id, Sensor.data_type.in_(("float", "int"))
            )
            .order_by(Sensor.name, Sensor.measurement)
            .all()
        )
        for sensor in sensors:
            data = Sensor.get_sensor_data_obj(
                sensor.name,
                cell_id,
                sensor.measurement,
                resample="none",
                start_time=start_time,
                end_time=end_time,
            )
            series.append(
                (
                    "sensor",
                    sensor.name,
                    sensor.measurement,
                    sensor.unit,
                    data["timestamp"],
                    data["data"],
                )
            )

        results = []
        for source, name, measurement, unit, timestamps, values in series:
            stats = _calculate_statistics(timestamps, values)
            if stats["count"] > 0:
                results.append(
                    {
                        "source": source,
                        "name": name,
                        "measurement": measurement,
                        "unit": unit,
                        **stats,
                    }
                )

        return {
            "cell_id": cell_id,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "statistics": results,
        }
