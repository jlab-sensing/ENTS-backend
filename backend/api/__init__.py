"""API module

Configures endpoints for DB

"""
import os
from flask import Flask, url_for, redirect, session, jsonify

from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_cors import CORS
from flask_migrate import Migrate
from flask_restful import Api
from .config import Config
from authlib.integrations.flask_client import OAuth
from flask_bcrypt import Bcrypt
from flask_session import Session

db = SQLAlchemy()
ma = Marshmallow()
migrate = Migrate()
oauth = OAuth()
bcrypt = Bcrypt()
google = oauth.register(
    name="google",
    client_kwargs={"scope": "openid email profile"},
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
)
server_session = Session()


def create_app() -> Flask:
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
    api = Api(app)
    server_session.init_app(app)

    with app.app_context():
        """-routing-"""

        from .resources.cell_data import Cell_Data
        from .resources.cell_id import Cell_Id
        from .resources.power_data import Power_Data
        from .resources.teros_data import Teros_Data
        from .resources.health_check import Health_Check
        from .resources.session import Session_r
        from .database.models.user import User

        api.add_resource(Health_Check, "/")
        api.add_resource(Cell_Data, "/cell/data/<int:cell_id>", endpoint="cell_data_ep")
        api.add_resource(Cell_Id, "/cell/id")
        api.add_resource(Power_Data, "/power", "/power/<int:cell_id>")
        api.add_resource(Teros_Data, "/teros", "/teros/<int:cell_id>")
        api.add_resource(Session_r, "/session")

        @app.route("/login")
        def login():
            redirect_uri = url_for("auth", _external=True)
            return oauth.google.authorize_redirect(redirect_uri)

        @app.route("/auth")
        def auth():
            token = oauth.google.authorize_access_token()
            email = token["userinfo"]["email"]
            user = User.query.filter_by(email=email).first()
            if not user:
                new_user = User(email=email, password="")
                db.session.add(new_user)
                db.session.commit()
                user = new_user
            session["user"] = {"id": user.id, "email": user.email}
            return redirect("/")

        @app.route("/logout")
        def logout():
            session.pop("user", None)
            return redirect("/")

    return app
