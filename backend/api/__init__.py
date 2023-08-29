"""API module

Configures endpoints for DB

"""
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_cors import CORS
from flask_migrate import Migrate
from flask_restful import Api
from .config import Config


db = SQLAlchemy()
ma = Marshmallow()
migrate = Migrate()


def create_app() -> Flask:
    """init flask app"""
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    ma.init_app(app)
    migrate.init_app(app, db)
    CORS(app, resources={r'/*': {'methods': '*'}})
    api = Api(app)
    with app.app_context():
        """-routing-"""

        from .resources.cell_data import Cell_Data
        from .resources.cell_id import Cell_Id
        from .resources.power_data import Power_Data
        from .resources.teros_data import Teros_Data
        from .resources.health_check import Health_Check
        api.add_resource(Health_Check, '/')
        api.add_resource(Cell_Data, '/api/cell/data/<int:cell_id>',
                         endpoint='cell_data_ep')
        api.add_resource(Cell_Id, '/api/cell/id')
        api.add_resource(Power_Data, '/api/power/', '/api/power/<int:cell_id>')
        api.add_resource(Teros_Data, '/api/teros/', '/api/teros/<int:cell_id>')

    return app
