from flask import request
from flask_restful import Resource
from ..models.sensor import Sensor


class CellSensors(Resource):
    def get(self):
        """Get distinct sensor names that exist for specified cells

        Query Parameters:
        - cell_ids: Comma-separated list of cell IDs

        Returns:
        - Dict mapping cell_id (string) to list of sensor names that have data
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

        rows = (
            Sensor.query.filter(Sensor.cell_id.in_(cell_ids))
            .with_entities(Sensor.cell_id, Sensor.name)
            .distinct()
            .all()
        )

        result = {}
        for cell_id, name in rows:
            result.setdefault(str(cell_id), []).append(name)

        return result, 200
