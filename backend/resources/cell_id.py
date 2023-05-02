from flask import jsonify
from flask_restful import Resource
import json
from json import JSONEncoder
import decimal

from sqlalchemy.orm import Session
from sqlalchemy import select

from ..db.conn import engine
from ..db.tables import Cell
from ..db.getters import get_power_data, get_teros_data


class Cell_Id(Resource):
    def get(self):
        with Session(engine) as sess:
            # Create cell select widget
            stmt = select(Cell).order_by(Cell.name)
            opts = [(str(c.id), repr(c)) for c in sess.scalars(stmt)]
        return jsonify(opts)

    def post(self):
        pass
