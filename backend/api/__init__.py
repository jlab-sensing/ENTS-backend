"""API module

Configures endpoints for DB

"""
import os
from flask import Flask, url_for, redirect, session, jsonify, request

from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_cors import CORS
from flask_migrate import Migrate
from flask_restful import Api
from .config import Config
from authlib.integrations.flask_client import OAuth
from flask_bcrypt import Bcrypt
from flask_session import Session
from .oauth2 import config_oauth
from .auth import bp
from .database.models import db


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

    config_oauth(app)
    app.register_blueprint(bp, url_prefix="")

    # def current_user():
    #     if "id" in session:
    #         uid = session["id"]
    #         return User.query.get(uid)
    #     return None

    # @app.route("/login", methods=["POST"])
    # def login():
    #     redirect_uri = res.data
    #     # redirect_uri = url_for("auth", _external=True)

    #     if request.method == 'POST':
    #         username = request.form.get('username')
    #         user = User.query.filter_by(username=username).first()
    #         if not user:
    #             user = User(username=username)
    #             db.session.add(user)
    #             db.session.commit()
    #         session['id'] = user.id
    #         # if user is not just to log in, but need to head back to the auth page, then go for it
    #         next_page = request.args.get('next')
    #         if next_page:
    #             return redirect(next_page)
    #         return redirect('/')
    #     user = current_user()
    #     if user:
    #         clients = OAuth2Client.query.filter_by(user_id=user.id).all()
    #     else:
    #         clients = []

    #     return render_template('home.html', user=user, clients=clients)

    #     print(redirect_uri, flush=True)
    #     return oauth.google.authorize_redirect(redirect_uri)

    # @app.route("/auth")
    # def auth():
    #     user = current_user()
    #     # if user log status is not true (Auth server), then to log it in
    #     if not user:
    #         return redirect(url_for("home.home", next=request.url))
    #     if request.method == "GET":
    #         try:
    #             grant = authorization.get_consent_grant(end_user=user)
    #         except OAuth2Error as error:
    #             return error.error
    #         return render_template("authorize.html", user=user, grant=grant)
    #     if not user and "username" in request.form:
    #         username = request.form.get("username")
    #         user = User.query.filter_by(username=username).first()
    #     if request.form["confirm"]:
    #         grant_user = user
    #     else:
    #         grant_user = None
    #     return authorization.create_authorization_response(grant_user=grant_user)

    #     # token = oauth.google.authorize_access_token()
    #     # email = token["userinfo"]["email"]
    #     # user = User.query.filter_by(email=email).first()
    #     # if not user:
    #     #     new_user = User(email=email, password="")
    #     #     db.session.add(new_user)
    #     #     db.session.commit()
    #     #     user = new_user
    #     # session["user"] = {"id": user.id, "email": user.email}
    #     # return jsonify({"id": user.id, "email": user.email})

    # @app.route("/logout")
    # def logout():
    #     session.pop("user", None)
    #     return redirect("/")

    return app
