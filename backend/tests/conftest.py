import os

import pytest

from api import create_app, db
from api.models.user import User

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

    with DatabaseJanitor(
        user=pg_user,
        host=pg_host,
        port=pg_port,
        dbname=pg_db,
        version=test_db.version,
        password=pg_password,
    ):
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


@pytest.fixture(scope="module")
def init_database(test_client):
    db.drop_all()
    # Create the database and the database table
    db.create_all()

    # # Insert user data
    # default_user = User(
    #     email="patkennedy79@gmail.com", password_plaintext="FlaskIsAwesome"
    # )
    # second_user = User(
    #     email="patrick@yahoo.com", password_plaintext="FlaskIsTheBest987"
    # )
    # db.session.add(default_user)
    # db.session.add(second_user)

    # Commit the changes for the users
    db.session.commit()
    #
    # # Insert book data
    # book1 = Book('Malibu Rising', 'Taylor Jenkins Reid', '5', default_user.id)
    # book2 = Book('Carrie Soto is Back', 'Taylor Jenkins Reid', '4', default_user.id)
    # book3 = Book('Book Lovers', 'Emily Henry', '3', default_user.id)
    # db.session.add(book1)
    # db.session.add(book2)
    # db.session.add(book3)

    # # Commit the changes for the books
    # db.session.commit()
    #
    yield  # this is where the testing happens!

    # db.drop_all()


#
# @pytest.fixture(scope='function')
# def log_in_default_user(test_client):
#     test_client.post('/login',
#     data={'email': 'patkennedy79@gmail.com', 'password': 'FlaskIsAwesome'})
#
#     yield  # this is where the testing happens!
#
#     test_client.get('/logout')
#
#
# @pytest.fixture(scope='function')
# def log_in_second_user(test_client):
#     test_client.post('login',
#     data={'email': 'patrick@yahoo.com','password': 'FlaskIsTheBest987'})
#
#     yield   # this is where the testing happens!
#
#     # Log out the user
#     test_client.get('/logout')
#
#
@pytest.fixture(scope="module")
def cli_test_client():
    # Set the Testing configuration prior to creating the Flask application
    os.environ["CONFIG_TYPE"] = "config.TestingConfig"
    flask_app = create_app()

    runner = flask_app.test_cli_runner()

    yield runner
