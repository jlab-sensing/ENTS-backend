from flask_restful import Resource

# from ..conn import engine
from ..auth.auth import get_optional_user
from ..models.cell import Cell
from ..schemas.cell_schema import CellSchema

cells_schema = CellSchema(many=True)


class Cell_Id(Resource):
    def get(self):
        user = get_optional_user()
        cells = [cell for cell in Cell.get_all() if cell.can_view(user)]
        return cells_schema.dump(cells)

    def post(self):
        pass
