from flask import Flask
from flask_cors import CORS, cross_origin
from flask_restful import Resource, Api

from sqlalchemy.orm import Session
from sqlalchemy import select

import json

from .resources.cell import Cell

app = Flask(__name__)
api = Api(app)
cors = CORS(app, resources={r'/*': {'methods': '*'}})


class HelloWorld(Resource):
    def get(self):
        return {'hello': 'world'}


api.add_resource(Cell, '/cell')
api.add_resource(HelloWorld, '/')
