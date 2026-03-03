from flask_restful import Resource

# from ..conn import engine
from ..models.cell import Cell
from ..schemas.cell_schema import CellSchema
from ..rate_limit import rate_limit

cells_schema = CellSchema(many=True)


class Cell_Id(Resource):
    @rate_limit("default")
    def get(self):
        cells = Cell.get_all()
        return cells_schema.dump(cells)

    @rate_limit("default")
    def post(self):
        pass
