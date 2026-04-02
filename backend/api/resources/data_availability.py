from flask import request
from flask_restful import Resource
from ..models.sensor import Sensor
from ..models.data import Data
from ..models.teros_data import TEROSData
from ..models.power_data import PowerData
from .. import db
from datetime import datetime, timedelta
from sqlalchemy import func, union_all, select


def _get_cell_availability(cell_id: int) -> dict:
    """Get availability for a single cell"""

    teros_q = select(TEROSData.ts).where(TEROSData.cell_id == cell_id)
    power_q = select(PowerData.ts).where(PowerData.cell_id == cell_id)
    sensor_q = select(Data.ts).join(Sensor).where(Sensor.cell_id == cell_id)

    combined = union_all(teros_q, power_q, sensor_q).subquery()

    row = db.session.query(func.max(combined.c.ts), func.min(combined.c.ts)).one()

    result = {
        "latest": row[0],
        "earliest": row[1],
    }

    return result


class DataAvailability(Resource):
    def get(self):
        """Get data availability information for intelligent date range selection.

        Returns the latest available data timestamp across all sensors for
        specified cells. This is used to implement smart default date ranges.

        Query Parameters:
        - cell_ids: Comma-separated list of cell IDs

        Returns:
        - latest_timestamp: Most recent data point across all sensors
        - earliest_timestamp: Oldest available data point
        - has_recent_data: Boolean indicating if data exists in last 14 days
        """
        cell_ids_param = request.args.get("cell_ids")

        if cell_ids_param is None:
            return {"error": "cell_ids parameter is required"}, 400

        try:
            cell_ids = [
                int(id.strip()) for id in cell_ids_param.split(",") if id.strip()
            ]
        except ValueError:
            return {"error": "Invalid cell_ids format"}, 400

        if not cell_ids:
            return {"error": "At least one valid cell_id is required"}, 400

        all_latest = []
        all_earliest = []

        for cell_id in cell_ids:
            cell_data = _get_cell_availability(cell_id)
            if cell_data["latest"]:
                all_latest.append(cell_data["latest"])
            if cell_data["earliest"]:
                all_earliest.append(cell_data["earliest"])

        if not all_latest:
            return {
                "latest_timestamp": None,
                "earliest_timestamp": None,
                "has_recent_data": False,
                "message": "No data found for specified cells",
            }

        latest_timestamp = max(all_latest)
        earliest_timestamp = min(all_earliest) if all_earliest else None
        two_weeks_ago = datetime.now() - timedelta(days=14)

        return {
            "latest_timestamp": latest_timestamp.isoformat(),
            "earliest_timestamp": (
                earliest_timestamp.isoformat() if earliest_timestamp else None
            ),
            "has_recent_data": latest_timestamp >= two_weeks_ago,
            "message": "success",
        }
