from flask import jsonify
from flask_restful import Resource
from json import JSONEncoder

from sqlalchemy.orm import Session
from sqlalchemy import select

from ..conn import engine
from ..models.models import Cell, CellSchema
from ..getters import get_power_data, get_teros_data

cell_schema = CellSchema()
cells_schema = CellSchema(many=True)

class Cell_Id(Resource):
    def get(self):
        cells = Cell.query.all()
        print(cells, flush=True)
        return cells_schema.dump(cells)

    def post(self):
        pass
