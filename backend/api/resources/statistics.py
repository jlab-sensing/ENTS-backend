from datetime import datetime, timedelta
from time import monotonic

from flask import current_app
from flask_restful import Resource
from sqlalchemy import func
from .. import db
from ..models.cell import Cell
from ..models.data import Data
from ..models.logger import Logger
from ..models.power_data import PowerData
from ..models.sensor import Sensor
from ..models.teros_data import TEROSData
from ..models.user import User

STATISTICS_CACHE_TTL_SECONDS = 30
_statistics_cache = None
_statistics_cache_time = 0.0


class Statistics(Resource):
    """Resource for platform-wide usage metrics and statistics."""

    def get(self):
        """Get aggregate metrics for the platform.

        Returns:
            JSON object containing totals for cells, loggers, users, and
            data points, plus the latest activity timestamp.
        """
        global _statistics_cache, _statistics_cache_time

        now = monotonic()
        if (
            not current_app.config.get("TESTING")
            and _statistics_cache is not None
            and now - _statistics_cache_time < STATISTICS_CACHE_TTL_SECONDS
        ):
            return _statistics_cache

        total_cells = db.session.query(func.count(Cell.id)).scalar() or 0
        archived_cells = (
            db.session.query(func.count(Cell.id))
            .filter(Cell.archive.is_(True))
            .scalar()
            or 0
        )

        # Hardware metrics
        total_loggers = db.session.query(func.count(Logger.id)).scalar() or 0
        total_users = db.session.query(func.count(User.id)).scalar() or 0

        # Data point metrics across tables
        power_points = db.session.query(func.count(PowerData.id)).scalar() or 0
        teros_points = db.session.query(func.count(TEROSData.id)).scalar() or 0
        generic_points = db.session.query(func.count(Data.id)).scalar() or 0

        total_data_points = power_points + teros_points + generic_points

        # These DateTime columns are naive. The power, TEROS, and generic
        # ingestion paths all use datetime.fromtimestamp(), producing naive
        # local time values for comparison.
        activity_cutoff = datetime.now() - timedelta(days=1)
        recent_cell_ids = (
            db.session.query(PowerData.cell_id)
            .filter(PowerData.ts >= activity_cutoff)
            .union(
                db.session.query(TEROSData.cell_id).filter(
                    TEROSData.ts >= activity_cutoff
                )
            )
            .union(
                db.session.query(Sensor.cell_id)
                .join(Data, Data.sensor_id == Sensor.id)
                .filter(Data.ts >= activity_cutoff)
            )
        )
        active_cells = (
            db.session.query(func.count())
            .select_from(recent_cell_ids.subquery())
            .scalar()
            or 0
        )

        # Latest transmission timestamp
        latest_power = db.session.query(func.max(PowerData.ts)).scalar()
        latest_teros = db.session.query(func.max(TEROSData.ts)).scalar()
        latest_generic = db.session.query(func.max(Data.ts)).scalar()

        all_ts = [
            ts for ts in (latest_power, latest_teros, latest_generic) if ts is not None
        ]
        latest_timestamp = max(all_ts).isoformat() if all_ts else None

        response = {
            "total_cells": total_cells,
            "active_cells": active_cells,
            "archived_cells": archived_cells,
            "total_loggers": total_loggers,
            "total_users": total_users,
            "total_data_points": total_data_points,
            "latest_timestamp": latest_timestamp,
            "data_breakdown": {
                "power": power_points,
                "teros": teros_points,
                "generic": generic_points,
            },
        }
        if not current_app.config.get("TESTING"):
            _statistics_cache = response
            _statistics_cache_time = now
        return response
