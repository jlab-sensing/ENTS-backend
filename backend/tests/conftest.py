import os

import pytest

from flask import has_app_context

from api import create_app, db
from api.models.user import User
from api.models.cell import Cell
from api.models.sensor import Sensor
from api.models.data import Data

import logging

# Optional dependency: we can run tests either:
# 1) Against an externally provided Postgres via TEST_SQLALCHEMY_DATABASE_URI, or
# 2) By spawning a temporary Postgres via pytest_postgresql (requires pg_config/pg_ctl).
#
# Important: only import pytest_postgresql when we actually need it. Importing it
# unconditionally can register atexit handlers that require elevated OS access in
# some sandboxes (psutil sysctl permissions on macOS).
factories = None
DatabaseJanitor = None
if not os.getenv("TEST_SQLALCHEMY_DATABASE_URI"):
    try:  # pragma: no cover
        from pytest_postgresql import factories
        from pytest_postgresql.janitor import DatabaseJanitor
    except Exception:  # pragma: no cover
        factories = None
        DatabaseJanitor = None


def requires_ttn():
    env = os.environ.get("TTN_API_KEY")

    return pytest.mark.skipif(env is None, reason="TTN_API_KEY not availble")
# --------
# Fixtures
# --------

logging.basicConfig()
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

if factories is not None:
    test_db = factories.postgresql_proc(port=None, dbname="test_db")
else:

    @pytest.fixture(scope="session")
    def test_db():
        pytest.skip(
            "pytest_postgresql is unavailable. Set TEST_SQLALCHEMY_DATABASE_URI "
            "to run tests against an existing Postgres."
        )


@pytest.fixture(scope="session")
def db_conn(request):
    """Session for SQLAlchemy."""
    external = os.getenv("TEST_SQLALCHEMY_DATABASE_URI")
    if external:
        yield external
        return

    if factories is None or DatabaseJanitor is None:
        pytest.skip(
            "No Postgres available for tests. Set TEST_SQLALCHEMY_DATABASE_URI "
            "or install pytest_postgresql."
        )

    test_db = request.getfixturevalue("test_db")
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
    os.environ["CONFIG_TYPE"] = "Testing"
    print("test", os.environ["TEST_SQLALCHEMY_DATABASE_URI"], flush=True)
    flask_app = create_app()

    # Create a test client using the Flask application configured for testing
    with flask_app.test_client() as testing_client:
        # Establish an application context
        with flask_app.app_context():
            # When using an externally provided DB, it persists across test runs.
            # Reset schema at the start of the test session to avoid unique-key
            # collisions from prior runs (e.g. cell.name is unique).
            if os.getenv("TEST_SQLALCHEMY_DATABASE_URI"):
                db.drop_all()
                db.create_all()
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


@pytest.fixture(scope="function")
def clear_data(test_client):
    """Clear all the data from sensor and data tables."""

    db.session.query(Data).delete()
    db.session.query(Sensor).delete()
    db.session.commit()

    yield test_client


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
    os.environ["CONFIG_TYPE"] = "Testing"
    flask_app = create_app()

    runner = flask_app.test_cli_runner()

    yield runner


@pytest.fixture(autouse=True)
def _db_session_cleanup():
    """Ensure no test leaves the DB session 'idle in transaction'.

    Some tests run read-only ORM queries without committing/rolling back, which
    leaves an open transaction and can block DDL in later fixtures (drop_all()).
    """
    yield
    if not has_app_context():
        return
    db.session.rollback()
    db.session.remove()
