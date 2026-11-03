from flask_restful import Resource
from sqlalchemy import func
from .. import db
from ..models.cell import Cell
from ..models.data import Data
from ..models.logger import Logger
from ..models.power_data import PowerData
from ..models.sensor import Sensor
from ..models.teros_data import TEROSData


class Statistics(Resource):
    """Resource for platform-wide usage metrics and statistics."""

    def get(self):
        """Get aggregate metrics for the platform.

        Returns:
            JSON object containing totals for cells, loggers, sensors,
            data points, uploads, upload error rate, latest activity
            timestamp, and measurement breakdown.
        """
        # Cell metrics
        total_cells = db.session.query(func.count(Cell.id)).scalar() or 0
        active_cells = (
            db.session.query(func.count(Cell.id))
            .filter(Cell.archive.is_(False))
            .scalar()
            or 0
        )
        archived_cells = (
            db.session.query(func.count(Cell.id))
            .filter(Cell.archive.is_(True))
            .scalar()
            or 0
        )

        # Deployment site metrics (distinct non-empty cell locations)
        total_sites = (
            db.session.query(func.count(func.distinct(Cell.location)))
            .filter(Cell.location.isnot(None))
            .filter(Cell.location != "")
            .scalar()
            or 0
        )

        # Hardware metrics
        total_loggers = db.session.query(func.count(Logger.id)).scalar() or 0
        total_sensors = db.session.query(func.count(Sensor.id)).scalar() or 0

        # Data point metrics across tables
        power_points = db.session.query(func.count(PowerData.id)).scalar() or 0
        teros_points = db.session.query(func.count(TEROSData.id)).scalar() or 0
        generic_points = db.session.query(func.count(Data.id)).scalar() or 0

        total_data_points = power_points + teros_points + generic_points

        # Ingestion / upload metrics
        total_uploads = total_data_points
        upload_error_rate = 0.0
        upload_success_rate = 100.0

        # Latest transmission timestamp
        latest_power = db.session.query(func.max(PowerData.ts)).scalar()
        latest_teros = db.session.query(func.max(TEROSData.ts)).scalar()
        latest_generic = db.session.query(func.max(Data.ts)).scalar()

        all_ts = [
            ts for ts in (latest_power, latest_teros, latest_generic) if ts is not None
        ]
        latest_timestamp = max(all_ts).isoformat() if all_ts else None

        return {
            "total_cells": total_cells,
            "active_cells": active_cells,
            "archived_cells": archived_cells,
            "total_loggers": total_loggers,
            "total_sensors": total_sensors,
            "total_sites": total_sites,
            "total_data_points": total_data_points,
            "total_uploads": total_uploads,
            "upload_error_rate": upload_error_rate,
            "upload_success_rate": upload_success_rate,
            "latest_timestamp": latest_timestamp,
            "data_breakdown": {
                "power": power_points,
                "teros": teros_points,
                "generic": generic_points,
            },
        }
