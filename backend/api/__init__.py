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
from flask_bcrypt import Bcrypt
from flask_session import Session
from authlib.integrations.flask_client import OAuth
from celery import Celery, Task
from datetime import timedelta
from .config import DevelopmentConfig, ProductionConfig, TestingConfig
from .conn import dburl

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
    # handle config type
    config_type_str = os.getenv("CONFIG_TYPE", default="Development")
    if config_type_str == "Development":
        config_type = DevelopmentConfig
    elif config_type_str == "Production":
        config_type = ProductionConfig
    elif config_type_str == "Testing":
        config_type = TestingConfig
    else:
        raise ValueError(f"Invalid config type: {config_type_str}")
    app.config.from_object(config_type)
    app.config["SQLALCHEMY_DATABASE_URI"] = (
        os.getenv("TEST_SQLALCHEMY_DATABASE_URI")
        if os.getenv("TEST_SQLALCHEMY_DATABASE_URI")
        else dburl
    )
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
                "visibility_timeout": int(timedelta(minutes=15).total_seconds()),
                "region": "us-west-2",
                "queue_name_prefix": "dirtviz-celery-",
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
    from .resources.sensor_data_json import SensorData_Json
    from .resources.cell import Cell
    from .resources.session import Session_r
    from .resources.users_data import User_Data
    from .resources.status import Status
    from .resources.data_availability import DataAvailability

    from .auth.routes import auth

    api.add_resource(Health_Check, "/")
    api.add_resource(Cell, "/cell/", "/cell/<int:cellId>")
    api.add_resource(Cell_Data, "/cell/datas", endpoint="cell_data_ep")
    api.add_resource(Cell_Id, "/cell/id")
    api.add_resource(Power_Data, "/power/", "/power/<int:cell_id>")
    api.add_resource(Teros_Data, "/teros/", "/teros/<int:cell_id>")
    api.add_resource(SensorData, "/sensor/")
    api.add_resource(SensorData_Json, "/sensor_json/")
    api.add_resource(DataAvailability, "/data-availability/")
    api.add_resource(Session_r, "/session")
    api.add_resource(User_Data, "/user")
    api.add_resource(Status, "/status/<string:id>")
    app.register_blueprint(auth, url_prefix="/api")
    return app
