# DirtViz

DirtViz is a project to visualize data collected from sensors deployed in sensor networks. The project involves developing web based plotting scripts to create a fully-fledged DataViz tool tailored to the data collected from embedded systems sensor networks.

## Integrations

Dirtviz is only a frontend and it needs some way of importing data into the backend database. Currently there are csv importers, chirpstack HTTP integration, and postgresql access.

### Postgresql

By default the `postgresql` instance is exposed on the host machine that can be connected with the following options
```
ip: localhost
port: 5432
user: dirtviz
password: password
table: dirtviz
```

### CSV Importers

There are csv importers that can be used to populate the database. Python utilities currently exist to import RocketLogger and TEROS data. These are available as modules under dirtviz. More information on used can be found by running the modules with the `--help` flag. It is recomended to setup a virtual enviroment to install the required packages listed in `requirements.txt`.

```
python -m dirtviz.db.utils.import_rl_csv
python -m dirtviz.db.utils.import_teros_csv
```

Before running the moduels the `DB_URL` must be set as a enviorment variable. By default you can set it with
```
export DB_URL=postgresql://dirtviz:password@localhost/dirtviz
```

### Setting up a Development Environment

The DirtViz application is designed to be run from docker. There are multiple container that all need to work together to the end user website up. Luckily for you all of it is defined within the `docker-compose.yml` file. Run the following command to start all the containers.

```
docker compose up -d
```

When adding functionality to the website there is a need to have sample data so that the graphs displayed are not blank. There is data included in the repo and can be imported using the `import_example_data.py` script. It is recommended to run the script from outside the container using the commands listed below to setup a virtual environment, install the necessary packages, and import the data. Due to the way docker mounts function, it is far quicker to import the data over a TCP connection to the postgresql container rather than mounting folder containing the data within the container. The other option would be to add the data to the dirtviz image, but that would increase the image size considerably. For now this is the best option as this functionality is not required in a production environment.

```bash
export DB_URL=postgresql://dirtviz:password@localhost/dirtviz
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt requirements-dev.txt
./import_example_data.py
```

If you want to reset the database, the following command will delete the postgresql volume causing the database to be recreated.

```
docker volume rm dirtviz_postgresqldata
```

### Database Migrations

This projects makes use of [alembic](https://alembic.sqlalchemy.org/en/latest/) to handle database migrations. It is recommended to have a understanding of the package first before attempting to modify the database schema. Due to the way that alembic handles package imports, the config file needs to be specified while running from the root project folder. For example the following will autogenerate new migrations from the latest revision of the database.

```bash
# Migrate to latest version
alembic -c dirtviz/db/alembic.ini upgrade head
# Autogenerate migration
alembic -c dirtviz/db/alembic.ini revision --autogenerate -m "<MIGRATION MESSAGE>"
# Run generated migration
alembic -c dirtviz/db/alembic.ini upgrade head
```

If the docker containers are used for development checking of the database is made easy by removing the `postgresqldata` volume to reset the database to a clean slate. Thus the full chain of migrations can be tested.

```bash
docker volume rm dirtviz_postgresqldata
```
