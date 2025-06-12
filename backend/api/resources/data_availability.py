from flask import request, jsonify
from flask_restful import Resource
from ..models.sensor import Sensor
from ..models.data import Data
from ..models.teros_data import TEROSData
from ..models.power_data import PowerData
from ..models import db
from datetime import datetime, timedelta
from sqlalchemy import func, and_


class DataAvailability(Resource):
    def get(self):
        """Get data availability information for intelligent date range selection
        
        Returns the latest available data timestamp across all sensors for specified cells.
        This is used to implement smart default date ranges.
        
        Query Parameters:
        - cell_ids: Comma-separated list of cell IDs
        
        Returns:
        - latest_timestamp: Most recent data point across all sensors
        - earliest_timestamp: Oldest data point in the last 2 months
        - has_recent_data: Boolean indicating if data exists in last 14 days
        """
        cell_ids_param = request.args.get('cell_ids', '')
        
        if not cell_ids_param:
            return jsonify({
                'error': 'cell_ids parameter is required'
            }), 400
            
        try:
            cell_ids = [int(id.strip()) for id in cell_ids_param.split(',') if id.strip()]
        except ValueError:
            return jsonify({
                'error': 'Invalid cell_ids format'
            }), 400
            
        if not cell_ids:
            return jsonify({
                'error': 'At least one valid cell_id is required'
            }), 400
        
        # Get latest timestamps from different data sources
        latest_timestamps = []
        
        # Check sensor data (generic sensors)
        sensor_latest = db.session.query(
            func.max(Data.ts)
        ).join(Sensor).filter(
            Sensor.cell_id.in_(cell_ids)
        ).scalar()
        
        if sensor_latest:
            latest_timestamps.append(sensor_latest)
        
        # Check TEROS data
        teros_latest = db.session.query(
            func.max(TEROSData.ts)
        ).filter(
            TEROSData.cell_id.in_(cell_ids)
        ).scalar()
        
        if teros_latest:
            latest_timestamps.append(teros_latest)
        
        # Check Power data
        power_latest = db.session.query(
            func.max(PowerData.ts)
        ).filter(
            PowerData.cell_id.in_(cell_ids)
        ).scalar()
        
        if power_latest:
            latest_timestamps.append(power_latest)
        
        if not latest_timestamps:
            return jsonify({
                'latest_timestamp': None,
                'earliest_timestamp': None,
                'has_recent_data': False,
                'message': 'No data found for specified cells'
            })
        
        # Find the most recent timestamp across all data sources
        latest_timestamp = max(latest_timestamps)
        
        # Check if we have data in the last 14 days
        two_weeks_ago = datetime.now() - timedelta(days=14)
        has_recent_data = latest_timestamp >= two_weeks_ago
        
        # Get earliest timestamp in the last 2 months for fallback range calculation
        two_months_ago = datetime.now() - timedelta(days=60)
        earliest_timestamps = []
        
        # Check earliest in sensor data within last 2 months
        sensor_earliest = db.session.query(
            func.min(Data.ts)
        ).join(Sensor).filter(
            and_(
                Sensor.cell_id.in_(cell_ids),
                Data.ts >= two_months_ago
            )
        ).scalar()
        
        if sensor_earliest:
            earliest_timestamps.append(sensor_earliest)
        
        # Check earliest in TEROS data within last 2 months
        teros_earliest = db.session.query(
            func.min(TEROSData.ts)
        ).filter(
            and_(
                TEROSData.cell_id.in_(cell_ids),
                TEROSData.ts >= two_months_ago
            )
        ).scalar()
        
        if teros_earliest:
            earliest_timestamps.append(teros_earliest)
        
        # Check earliest in Power data within last 2 months
        power_earliest = db.session.query(
            func.min(PowerData.ts)
        ).filter(
            and_(
                PowerData.cell_id.in_(cell_ids),
                PowerData.ts >= two_months_ago
            )
        ).scalar()
        
        if power_earliest:
            earliest_timestamps.append(power_earliest)
        
        earliest_timestamp = min(earliest_timestamps) if earliest_timestamps else None
        
        return jsonify({
            'latest_timestamp': latest_timestamp.isoformat() if latest_timestamp else None,
            'earliest_timestamp': earliest_timestamp.isoformat() if earliest_timestamp else None,
            'has_recent_data': has_recent_data,
            'message': 'success'
        }) 