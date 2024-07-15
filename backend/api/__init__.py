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
from celery import Celery, Task
from datetime import timedelta


db = SQLAlchemy()
ma = Marshmallow()
migrate = Migrate()
bcrypt = Bcrypt()
server_session = Session()
oauth = OAuth()


def celery_init_app(app: Flask) -> Celery:
    class FlaskTask(Task):
        def __call__(self, *args: object, **kwargs: object) -> object:
            with app.app_context():
                return self.run(*args, **kwargs)

    celery_app = Celery(app.name, task_cls=FlaskTask)
    celery_app.config_from_object(app.config["CELERY"])
    celery_app.set_default()
    app.extensions["celery"] = celery_app
    return celery_app


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

    # configuration for celery
    # broker_transport_options:
    #   tasks should not take longer than 15 minutes to run
    # task_acks_late:
    #   tasks should be acknowledged after completetion
    # task_reject_on_worker_lost:
    #   reject tasks when worker dies (eg sigkill) prevents loops
    # worker_prefetch_multipler:
    #   set to 1 from default 4 to prevent tasks from stalling prefetch tasks
    # https://rusty-celery.github.io/best-practices/index.html
    # Note: for potential extensibility with fargate
    # Celery Setup
    # https://github.com/jangia/celery_ecs_example
    app.config.from_mapping(
        CELERY=dict(
            broker_url=os.getenv("CELERY_BROKER_URL"),
            result_backend=os.getenv("CELERY_RESULT_BACKEND"),
            task_ignore_result=True,
            broker_transport_options={
                "visibility_timeout": timedelta(minutes=15).total_seconds(),
            },
            task_ack_late=True,
            task_reject_on_worker_lost=True,
            worker_prefetch_multipler=1,
            broker_connection_retry_on_startup=True,
        ),
    )
    app.config.from_prefixed_env()
    celery_init_app(app)

    """-routing-"""
    app.app_context().push()
    from .resources.health_check import Health_Check
    from .resources.cell_data import Cell_Data
    from .resources.cell_id import Cell_Id
    from .resources.power_data import Power_Data
    from .resources.teros_data import Teros_Data
    from .resources.sensor_data import SensorData
    from .resources.cell import Cell
    from .resources.session import Session_r
    from .resources.users_data import User_Data
    from .resources.status import Status

    from .auth.routes import auth

    api.add_resource(Health_Check, "/")
    api.add_resource(Cell, "/cell/")
    api.add_resource(Cell_Data, "/cell/datas", endpoint="cell_data_ep")
    api.add_resource(Cell_Id, "/cell/id")
    api.add_resource(Power_Data, "/power/", "/power/<int:cell_id>")
    api.add_resource(Teros_Data, "/teros/", "/teros/<int:cell_id>")
    api.add_resource(SensorData, "/sensor/")
    api.add_resource(Session_r, "/session")
    api.add_resource(User_Data, "/user")
    api.add_resource(Status, "/status/<string:id>")
    app.register_blueprint(auth, url_prefix="/api")
    return app
