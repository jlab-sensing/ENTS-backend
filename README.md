# ![ENTS-Backend](.github/assets/img/ents_backend_logo.svg)

![Build](https://github.com/jlab-sensing/ENTS-backend/actions/workflows/deploy.yml/badge.svg?branch=main)
![Test](https://github.com/jlab-sensing/ENTS-backend/actions/workflows/test.yml/badge.svg?branch=main)
[![codecov](https://codecov.io/github/jlab-sensing/ENTS-backend/graph/badge.svg?token=L4PKSR61XU)](https://codecov.io/github/jlab-sensing/ENTS-backend)

Environmental Networked Sensing (ENTS) backend is part of the ENTS hardware and software ecosystem for outdoor sensor networks. It's an open source data ingestion and visualization service that parses data from the hardware nodes and presents it in an easy-to-use web interface. Users can dynamically generate interactive plots, live monitor their sensors, or download data for offline processing. Our live version, DirtViz, is available at [https://dirtviz.jlab.ucsc.edu/](https://dirtviz.jlab.ucsc.edu/).

## Dependencies

| Dependency |
| ---------- |
| Python     |
| Node       |
| Docker     |

## Getting Started

### Starting Services

A local version of the ENTS backend can be started using `docker-compose.yml`. This will build the local images and start the required services in the background, including the database.

```console
docker compose up --build -d
```

At this point the backend is accessible at [http://localhost:3000/](http://localhost:3000/), but will likely show a blank page in your web browser and throw an error. This is due to the database being empty, therefore there is no data to display.

<!-- for reference OLD -->

### Migrate Database

Alembic is used to manage database migrations. Alembic is a python package and acts as a complement to sqlalchemy which is used to query the database. The following will upgrade the database to the most recent version and should be done any time the database schema changes.

> **NOTE:** It is recommended that a virtual environment is setup and **_ALL_** dependencies are installed via `pip install -r requirements.txt`. If you are unsure what this means, read [this](https://docs.python.org/3/tutorial/venv.html).

A migration script is provided in this repository that abstracts the migration process.

```bash
# To check out usage run
./migrate.sh -h
```

### Import Example Data

Real life example data is provided and can be imported with the following. The data was collected at UC Santa Cruz by jlab.

```console
python ./import_example_data.py
```

Now some graphs should appear on the website and look like the following.

![Example screenshot of ENTS backend](.github/assets/img/dashboard.png)

## Architecture

### System

ENTS backend's client is built with React and is located under the `frontend` folder. ENTS backend's API is built with Flask and located under the `backend` folder. Check out the [frontend readme](frontend/README.md) and the [backend readme](backend/README.md) for more information.

### Local Development and Production Environments

To compile for with development configurations (eg. hot reload and logs), in `docker-compose.yml` set `target: development`. To test containers in with production configuration use `target: production`.

## Support

For bugs refer to [bug_template.md](.github/ISSUE_TEMPLATE/bug_template). For other issues, create an new issue in this repository.

For documentation on the backend, refer to [backend readme](backend/README.md)

## Contributing

To start contributing to the ENTS backend, please read [CONTRIBUTING.md](CONTRIBUTING.md)

Here's a list of [good first issues](https://github.com/jlab-sensing/DirtViz/labels/good%20first%20issue) to get yourself familiar with the ENTS backend. Comment in the issue to pick it up, and feel free to ask any questions!

## FAQ

### How do I create database migrations?

This projects makes use of [alembic](https://alembic.sqlalchemy.org/en/latest/) to handle database migrations and [flask-migrate](https://flask-migrate.readthedocs.io/en/latest/) as an extension to make alembic operations avaliable through the Flask cli. It is recommended to have a understanding of the package first before attempting to modify the database schema. Due to the way that alembic handles package imports, the config file needs to be specified while running from the root project folder. For example the following will autogenerate new migrations from the latest revision of the database.

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

### How do I import my own TEROS and Rocketlogger data previously collected?

There exists csv importers that can be used to populate the database. Python utilities currently exist to import RocketLogger and TEROS data. These are available as modules under the backend folder. More information on used can be found by running the modules with the `--help` flag.

```bash
python -m backend.api.database.utils.import_cell_data
```

## Maintainers

- Aaron Wu [aaron-wu1](https://github.com/aaron-wu1)

## Contributors

- John Madden [jmadden173](https://github.com/jmadden173)
- Alec Levy [aleclevy](https://github.com/aleclevy)
