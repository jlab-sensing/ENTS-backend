from flask import jsonify
from flask_restful import Resource
from json import JSONEncoder

from sqlalchemy.orm import Session
from sqlalchemy import select

# from ..conn import engine
from ..database.models.cell import Cell
from ..database.schemas.cell_schema import CellSchema

cells_schema = CellSchema(many=True)


class Cell_Id(Resource):
    def get(self):
        cells = Cell.query.all()
        return cells_schema.dump(cells)

    def post(self):
        pass
