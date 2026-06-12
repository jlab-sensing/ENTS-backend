# Development Information

## Quickstart

**Start development environment**

```bash
cp .env.example .env
docker compose up --build -d
```

Then goto [http://localhost:3000/](http://localhost:3000/) for the website. Logins will not work as they require Google auth keys. See below.

**Monitor API Logs**

```bash
docker compose logs -f backend
```

## General Information

### Installing Dependencies

**Frontend**

```bash
cd frontend
npm install
```

**Backend**

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

### Testing

Alternatives are listed for running the same tests that that the CI uses

**Frontend**

```bash
cd frontend
npm run test
```

```bash
ENV_FILE=ci.env docker compose up frontend-test
```


**Backend**

```bash
cd backend
pytest
```

```bash
ENV_FILE=ci.env docker compose up backend-test
```

### Flask Configuration

The `CONFIG_TYPE` configures the Flask app to run in either `development` mode with value of `Development` or `production` mode with a value of `Production`. There is a `testing` mode with value of `Testing` as well, but this is used for running unit tests and should not be used in production.

### Simulate Hardware Data

Example sensor data can be streamed to the backend using the [ents](https://pypi.org/project/ents/) CLI tool.

Install the ents CLI tool:

```bash
pip install ents
```
Then stream simulated sensor data to your local backend instance:

```bash
ents sim_generic stream \
  --url http://localhost:3000/api/sensor/ \
  --sensor BME280_TEMP BME280_PRESSURE BME280_HUMIDITY \
  --cell 1 \
  --logger 1
```

Once the data stream starts, graphs should appear on the website similar to the example below.

![Example screenshot of ENTS backend](.github/assets/img/dashboard.png)

### Migrate Database

Alembic is used to manage database migrations. Alembic is a python package and acts as a complement to sqlalchemy which is used to query the database. The following will upgrade the database to the most recent version and should be done any time the database schema changes.

> **NOTE:** It is recommended that a virtual environment is setup and **_ALL_** dependencies are installed via `pip install -r requirements.txt`. If you are unsure what this means, read [this](https://docs.python.org/3/tutorial/venv.html).

A migration script is provided in this repository that abstracts the migration process.

```bash
# To check out usage run
./migrate.sh -h
```

### Starting Services

A local version of the ENTS backend can be started using `docker-compose.yml`. This will build the local images and start the required services in the background, including the database.

```console
docker compose up --build -d
```

At this point the backend is accessible at [http://localhost:3000/](http://localhost:3000/), but will likely show a blank page in your web browser and throw an error. This is due to the database being empty, therefore there is no data to display.

### Generating environmental variables

The frontend and backend containers require environmental variables to be set in order to run. These are stored in a `.env` file in the root directory, which you will need to create based on the provided `.env.example` template. Copy `.env.example` to `.env` and update the values as needed.

```bash
cp .env.example .env
# Now edit .env with your own values
```

The `.env` file is used to provide the necessary environment variables to the local development containers and can be used as a base to setup environment variables for a production environment. The `.env` file should never be committed to the repository as it contains sensitive information.

> NOTE: We have run into issues with syntax of AWS ECS with the environment file. The string encapsulation characters `'` and `"` are treated as literals, while [docker supports quoting](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/#env-file-syntax).


### Accessing Environment Variables

To access environment variables for development against the production version of the website, you must utilize our python script 'env-import.py'. To use this, you must first:

1. Contact a member of jLab to be granted AWS credentials
2. Download aws cli (preferred method is through brew)
3. Run the command `aws configure`
4. Input your AWS Access Key ID, AWS Secret Access Key, Default region name (us-west-1), and output format (None)
5. Run the python script! `python3 env-import.py`


## FAQ

### How do I create database migrations?

This projects makes use of [alembic](https://alembic.sqlalchemy.org/en/latest/) to handle database migrations and [flask-migrate](https://flask-migrate.readthedocs.io/en/latest/) as an extension to make alembic operations available through the Flask cli. It is recommended to have a understanding of the package first before attempting to modify the database schema. Due to the way that alembic handles package imports, the config file needs to be specified while running from the root project folder. For example the following will autogenerate new migrations from the latest revision of the database.

The script migrate.sh takes in a "-m \<msg\>" for generating a new migration and by itself runs "alembic upgrade head".

> **NOTE:** Autogeneration of migrations requires a running version of the database. Refer above to see how to create and connect to a local version of the database

```bash
./migrate.sh -m "migration message here"
```

### How do I reset the local database?

Sometimes the database breaks and causes errors. Usually deleting the docker volume `postgresqldata` causing the database to be recreated fixes the issue. The following does exactly that and reapplies the migrations to the cleaned database.

```console
docker compose down
docker volume rm dirtviz_postgresqldata
docker compose up --build -d
./migrate.sh -u
```

### \[Flask-migrate\] Error: Can't locate revision identified by 'e5dbb2a59f94'

For this error, it either means that you've deleted a revision corresponding to the id located in `./backend/api/migrations/versions` or that if it's during the deployment process, the alembic version in the db (under the alembic version table) is mismatched. Double check to see if the revision history is the same for both deployment and locally.
