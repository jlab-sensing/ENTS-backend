"""POST /api/equations/validate — server-side equation allow-list validation."""

from flask import request
from flask_restful import Resource

from ..equation.validate import EquationValidationError, validate_expression


class EquationValidate(Resource):
    def post(self):
        payload = request.get_json(silent=True) or {}
        expression = payload.get("expression", "")
        cell_ids = payload.get("cell_ids")

        selected_cell_ids = None
        if cell_ids is not None:
            if not isinstance(cell_ids, list):
                return {"error": "cell_ids must be an array of integers"}, 400
            try:
                selected_cell_ids = [int(cell_id) for cell_id in cell_ids]
            except (TypeError, ValueError):
                return {"error": "cell_ids must be an array of integers"}, 400

        try:
            result = validate_expression(expression, selected_cell_ids=selected_cell_ids)
        except EquationValidationError as exc:
            return {"error": str(exc)}, 400

        return result, 200
