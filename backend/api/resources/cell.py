from flask_restful import Resource
from flask import request, jsonify

# from ..conn import engine
from ..database.models.cell import Cell as CellModel
from ..database.schemas.add_cell_schema import AddCellSchema

cells_schema = AddCellSchema(many=True)
cell_schema = AddCellSchema()


class Cell(Resource):
    def get(self):
        cells = CellModel.query.all()
        return cells_schema.dump(cells)

    def post(self):
        json_data = request.json
        cell_data = cell_schema.load(json_data)
        cell_name = cell_data["name"]
        location = cell_data["location"]
        lat = cell_data["latitude"]
        long = cell_data["longitude"]
        userEmail = cell_data["userEmail"]
        if cell_data["archive"] is None:
            archive = False
        else:
            archive = cell_data["archive"]
        new_cell = CellModel.add_cell_by_user_emailcell(
            cell_name, location, lat, long, archive, userEmail
        )
        return jsonify(new_cell)

    def put(self, cellId):
        json_data = request.json
        archive = json_data.get("archive")
        cell = CellModel.get(cellId)
        if cell:
            cell.archive = archive
            cell.save()
            return {"message": "Successfully updated cell"}
        return jsonify({"message": "Cell not found"}), 404
