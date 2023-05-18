from .resources.cell_data import Cell_Data
from .resources.cell_id import Cell_Id
from flask_restful import Resource, Api
import app

api = Api(app)


class HelloWorld(Resource):
    def get(self):
        return {'hello': 'world'}


api.add_resource(Cell_Data, '/api/cell/data/<int:cell_id>',
                 endpoint='cell_data_ep')
api.add_resource(Cell_Id, '/api/cell/id')
api.add_resource(HelloWorld, '/api/hello')
