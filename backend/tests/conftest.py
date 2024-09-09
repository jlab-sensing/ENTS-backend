import os

import pytest

from api import create_app, db
from api.models.user import User
from api.models.cell import Cell

import logging
from pytest_postgresql import factories
from pytest_postgresql.janitor import DatabaseJanitor

# --------
# Fixtures
# --------

logging.basicConfig()
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

test_db = factories.postgresql_proc(port=None, dbname="test_db")


@pytest.fixture(scope="session")
def db_conn(test_db):
    """Session for SQLAlchemy."""
    pg_host = test_db.host
    pg_port = test_db.port
    pg_user = test_db.user
    pg_password = test_db.password
    pg_db = test_db.dbname

    # Self cleanup for postgres testing db instance
    with DatabaseJanitor(
        user=pg_user,
        host=pg_host,
        port=pg_port,
        dbname=pg_db,
        version=test_db.version,
        password=pg_password,
    ):
        # Setting context of testing db
        connection_str = f"postgresql+psycopg2://{pg_user}:@{pg_host}:{pg_port}/{pg_db}"
        yield connection_str


@pytest.fixture(scope="module")
def new_user():
    user = User(
        first_name="test", last_name="dummy", email="test123@foo.bar", password=""
    )
    return user


@pytest.fixture(scope="module")
def test_client(db_conn):

    # Set the Testing configuration prior to creating the Flask application
    os.environ["TEST_SQLALCHEMY_DATABASE_URI"] = db_conn
    os.environ["CONFIG_TYPE"] = "api.config.TestingConfig"
    print("test", os.environ["TEST_SQLALCHEMY_DATABASE_URI"], flush=True)
    flask_app = create_app()

    # Create a test client using the Flask application configured for testing
    with flask_app.test_client() as testing_client:
        # Establish an application context
        with flask_app.app_context():
            yield testing_client


# split this up to multiple sessions
# modify sql db here instead


@pytest.fixture(scope="module")
def init_database(test_client):
    db.drop_all()
    # Create the database and the database table
    db.create_all()

    # FIXME:
    # refactor later for support of cells
    #

    # setup cells
    # cell = Cell("cell_1", "", 1, 1, False, None)
    # cell2 = Cell("cell_2", "", 2, 2, False, None)
    # db.session.add(cell)
    # db.session.add(cell2)

    # Insert Power data

    # context for testing fixure
    yield test_client

    # FIXME:
    # can't clean up because methods in the power and teros models
    # uses sessions to update data to the db
    # hence since the test run asyncronously, we can't drop all
    # the db tables since other tests are using them
    # we need to wait or have the fixure generate all the values
    # db.session.commit()
    # db.drop_all()


@pytest.fixture(scope="module")
def setup_cells(test_client):
    # db.drop_all()
    # Create the database and the database table
    db.create_all()
    cell = Cell("cell_1", "", 1, 1, False, None)
    cell2 = Cell("cell_2", "", 2, 2, False, None)
    db.session.add(cell)
    db.session.add(cell2)
    db.session.commit()

    # context for testing fixure
    yield test_client


@pytest.fixture(scope="module")
def cli_test_client():
    # Set the Testing configuration prior to creating the Flask application
    os.environ["CONFIG_TYPE"] = "config.TestingConfig"
    flask_app = create_app()

    runner = flask_app.test_cli_runner()

    yield runner
