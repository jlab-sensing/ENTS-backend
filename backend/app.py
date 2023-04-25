from flask import Flask
from flask_cors import CORS, cross_origin
from flask_restful import Resource, Api

from sqlalchemy.orm import Session
from sqlalchemy import select

import json

from .resources.cell_data import Cell_Data
from .resources.cell_id import Cell_Id

app = Flask(__name__)
api = Api(app)
cors = CORS(app, resources={r'/*': {'methods': '*'}})


class HelloWorld(Resource):
    def get(self):
        return {'hello': 'world'}


api.add_resource(Cell_Data, '/api/cell/data/<int:cell_id>',
                 endpoint='cell_data_ep')
api.add_resource(Cell_Id, '/api/cell/id')
api.add_resource(HelloWorld, '/api/hello')


@app.errorhandler(404)
def not_found(e):
    return app.send_static_file('index.html')
