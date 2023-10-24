from flask_restful import Resource
from flask import request

# from ..conn import engine
from ..database.models.cell import Cell as CellModel
from ..database.schemas.cell_schema import CellSchema

cells_schema = CellSchema(many=True)
cell_schema = CellSchema()


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
        new_cell = CellModel(
            name=cell_name, location=location, latitude=lat, longitude=long
        )
        new_cell.save()
        return cell_schema.jsonify(new_cell)
