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

    with app.app_context():
        """-routing-"""

        from .resources.cell_data import Cell_Data
        from .resources.cell_id import Cell_Id
        from .resources.power_data import Power_Data
        from .resources.teros_data import Teros_Data
        from .resources.health_check import Health_Check
        from .database.models.user import User

        api.add_resource(Health_Check, "/")
        api.add_resource(
            Cell_Data, "/api/cell/data/<int:cell_id>", endpoint="cell_data_ep"
        )
        api.add_resource(Cell_Id, "/api/cell/id")
        api.add_resource(Power_Data, "/api/power/", "/api/power/<int:cell_id>")
        api.add_resource(Teros_Data, "/api/teros/", "/api/teros/<int:cell_id>")

        @app.route("/test")
        def test():
            user = session.get("user")
            return {"user": user}

        @app.route("/login")
        def login():
            redirect_uri = url_for("auth", _external=True)
            return oauth.google.authorize_redirect(redirect_uri)

        @app.route("/auth")
        def auth():
            token = oauth.google.authorize_access_token()
            email = token["userinfo"]["email"]
            user_exists = User.query.filter_by(email=email).first() is not None
            if not user_exists:
                new_user = User(email=email, password="")
                db.session.add(new_user)
                db.session.commit()
                user_exists = new_user
            session["user"] = {"id": user_exists.id, "email": user_exists.email}
            return redirect("/test")

        @app.route("/logout")
        def logout():
            session.pop("user", None)
            return redirect("/")

    return app
