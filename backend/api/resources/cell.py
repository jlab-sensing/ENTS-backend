from flask_restful import Resource

# from ..conn import engine
from ..database.models.cell import Cell as CellModel
from ..database.schemas.cell_schema import CellSchema

cells_schema = CellSchema(many=True)


class Cell(Resource):
    def get(self):
        cells = Cell.query.all()
        return cells_schema.dump(cells)

    def post(self, cellName, location, coordinates):
        new_cell = CellModel(name=cellName, location=location, coordinates=coordinates)
        new_cell.save()
        return CellSchema.jsonify(new_cell)
