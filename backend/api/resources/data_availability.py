from flask import request
from flask_restful import Resource
from ..auth.auth import authenticate_apikey_or_jwt
from ..models.cell import Cell
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
    method_decorators = [authenticate_apikey_or_jwt]

    def get(self, user):
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
            requested_cell_ids = [
                int(id.strip()) for id in cell_ids_param.split(",") if id.strip()
            ]
        except ValueError:
            return {"error": "Invalid cell_ids format"}, 400

        if not requested_cell_ids:
            return {"error": "At least one valid cell_id is required"}, 400

        requested_cells = Cell.query.filter(Cell.id.in_(requested_cell_ids)).all()
        user_cell_ids = {cell.id for cell in user.cells}
        authorized_cell_ids = {
            cell.id
            for cell in requested_cells
            if cell.is_public or cell.id in user_cell_ids
        }
        cell_ids = [cid for cid in requested_cell_ids if cid in authorized_cell_ids]

        if not cell_ids:
            return {"error": "No accessible cell_ids provided"}, 403

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
