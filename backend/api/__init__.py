"""API module

Configures endpoints for DB

"""

import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_cors import CORS
from flask_migrate import Migrate
from flask_restful import Api
from .config import Config
from flask_bcrypt import Bcrypt
from flask_session import Session
from authlib.integrations.flask_client import OAuth


db = SQLAlchemy()
ma = Marshmallow()
migrate = Migrate()
bcrypt = Bcrypt()
server_session = Session()
oauth = OAuth()


def create_app(debug: bool = False) -> Flask:
    """init flask app"""
    app = Flask(__name__)
    app.secret_key = os.getenv("APP_SECRET_KEY")
    app.config.from_object(Config)
    db.init_app(app)
    ma.init_app(app)
    migrate.init_app(app, db)
    oauth.init_app(app)
    bcrypt.init_app(app)
    CORS(app, resources={r"/*": {"methods": "*"}})
    api = Api(app, prefix="/api")
    server_session.init_app(app)

    """-routing-"""
    app.app_context().push()
    from .resources.health_check import Health_Check
    from .resources.cell_data import Cell_Data
    from .resources.cell_id import Cell_Id
    from .resources.power_data import Power_Data
    from .resources.teros_data import Teros_Data
    from .resources.power_data_protobuf import Power_Data_Protobuf
    from .resources.teros_data_protobuf import Teros_Data_Protobuf
    from .resources.sensor_data import Sensor_Data
    from .resources.cell import Cell
    from .resources.session import Session_r
    from .resources.users_data import User_Data

    from .auth.routes import auth

    api.add_resource(Health_Check, "/")
    api.add_resource(Cell, "/cell/")
    api.add_resource(Cell_Data, "/cell/data/<int:cell_id>", endpoint="cell_data_ep")
    api.add_resource(Cell_Id, "/cell/id")
    api.add_resource(Power_Data, "/power/", "/power/<int:cell_id>")
    api.add_resource(Teros_Data, "/teros/", "/teros/<int:cell_id>")
    api.add_resource(
        Power_Data_Protobuf, "/power-proto", "/power-proto/<int:sensor_id>"
    )
    api.add_resource(Teros_Data_Protobuf, "/teros-proto", "/teros-proto/<int:cell_id>")
    api.add_resource(Sensor_Data, "/sensor", "/sensor/<int:sensor_id>")
    api.add_resource(Session_r, "/session")
    api.add_resource(User_Data, "/user")
    app.register_blueprint(auth, url_prefix="/api")
    return app
