from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_cors import CORS, cross_origin
from flask_restful import Api
from .config import Config


db = SQLAlchemy()
ma = Marshmallow()


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    ma.init_app(app)
    cors = CORS(app, resources={r'/*': {'methods': '*'}})
    api = Api(app)
    with app.app_context():
        from .resources.cell_data import Cell_Data
        from .resources.cell_id import Cell_Id
        api.add_resource(Cell_Data, '/api/cell/data/<int:cell_id>',
                         endpoint='cell_data_ep')
        api.add_resource(Cell_Id, '/api/cell/id')

    return app
