# DirtViz

DirtViz is a project to visualize data collected from sensors deployed in sensor networks. The project involves developing web based plotting scripts to create a fully-fledged DataViz tool tailored to the data collected from embedded systems sensor networks. A live version of the website is available at [https://dirtviz.jlab.ucsc.edu/](https://dirtviz.jlab.ucsc.edu/).

## Dependencies

| Dependency |
|------------|
| Python     |
| Docker     |

## Getting Started

### Starting Services

A local version of Dirtviz can be started using `docker-compose.yml`. This will build the local images and start the required services in the background, including the database.

```
docker compose up --build -d
```

At this point the portal is accessible at [http://localhost:5006/dirtviz](http://localhost:5006/dirtviz), but will likely show a blank page in your web browser and throw an error. This is due to the database being empty, therefore there is no data to display.

### Setup Connection Stings

The following table shows the default values to connect to the postgresql instance.

> **NOTE:** The database connection strings are set to static simple values as defined in `docker-compose.yml`. Do ***NOT*** use the default values for any publicly facing deployment.

| Name     | Key         | Value     |
|----------|-------------|-----------|
| User     | DB_USER     | dirtviz   |
| Password | DB_PASS     | password  |
| Hostname | DB_HOST     | localhost |
| Port     | DB_PORT     | 5432      |
| Database | DB_DATABASE | dirtviz   |

The following commands will set the necessary environment variables to allow utilities within Dirtviz to connect to the database.

```bash
export DB_USER=dirtviz
export DB_PASS=password
export DB_HOST=localhost
export DB_PORT=5432
export DB_DATABASE=dirtviz
```

### Migrate Database

Alembic is used to manage database migrations. Alembic is a python package and acts as a complement to sqlalchemy which is used to query the database. The following will upgrade the database to the most recent version and should be done any time the database schema changes.

> **NOTE:** It is recommended that a virtual environment is setup and ***ALL*** dependencies are installed via `pip install -r requirements.txt`. If you are unsure what this means, read [this](https://docs.python.org/3/tutorial/venv.html).

```bash
alembic -c dirtviz/db/alembic.ini upgrade head
```

### Import Example Data

Real life example data is provided and can be imported with the following. The data was collected at UC Santa Cruz by jlab.

```bash
python import_example_data.py
```

Now some graphs should appear on the website and look like the following.

![Example screenshot of Dirtviz](.github/assets/img/screenshot.png)


## Running in Production

### TL;DR

To create a new development environment you must create a new branch. For each issue/feature, a new branch should be created. The environment will automatically be created and simultaneously deleted once the branch is deleted. The branch name ***MUST NOT*** be more than 55 characters, see [#52](https://github.com/jlab-sensing/DirtViz/issues/52). The website can be access via [https://dirtviz.jlab.ucsc.edu/dev/branch/portal/](https://dirtviz.jlab.ucsc.edu/dev/branch/portal/). The services `cs-http` and `http-api` are also assessable under [https://dirtviz.jlab.ucsc.edu/dev/branch/cs-http/](https://dirtviz.jlab.ucsc.edu/dev/branch/cs-http/) and [https://dirtviz.jlab.ucsc.edu/dev/branch/http-api/](https://dirtviz.jlab.ucsc.edu/dev/branch/http-api/) respectively. Replace `branch` with the name of the newly created branch.

### Overview

Dirtviz is intended to be deployed to a Kubernetes cluster. This way development work can be completed using a locally running Docker instance via `docker-compose` using the same containers that run in production. The only difference is that the Kubernetes deployments connects to a production database rather than the docker compose stack that runs the postgresql and Adminer instances as services. For our labs purposes, deployments are controlled through Github actions to build the containers then deploy the full stack to our locally hosted Kubernetes cluster.

### Github Setup

The Github repo is automatically setup to deploy to a Kubernetes instance. The only setup required is to setup Github secrets for the hostname, ssh key, and database connection parameters. The following gives the values needed to deploy to production.

| Name            | Example     | Description                                                                                                    |
|-----------------|-------------|----------------------------------------------------------------------------------------------------------------|
| USER            | johndoe     | User to perform k8s actions                                                                                    |
| HOSTNAME        | example.com | Hostname/IP of production server                                                                               |
| SSH_KNOWN_HOSTS |             | Fingerprint to populate ~/.ssh/known_hosts                                                                     |
| SSH_PRIVATE_KEY |             | Private SSH key for USER                                                                                       |
| DB_HOST         | example.com | Hostname/IP of database                                                                                        |
| DB_PORT         | 5432        | Port of database                                                                                               |
| DB_USER         | johndoe     | User login for database                                                                                        |
| DB_PASS         | password    | Password for DB_USER                                                                                           |

### Accessing Deployments

> **NOTE**: The following talks about accessing a deployment in a generic manner, not distinguishing between production and development environments. Think of production as a development branch under the name `main`.

#### Updating a Deployment

A branch is deployed whenever there are changes pushed to the repository. It does **NOT** run tests or lint on the code before being pushed to production. The following are the steps for deployment.

1. Build `portal`, `cs-http`, and `http-api` containers
2. Generate k8s yaml files from templates
3. Apply configurations to k8s via ssh
4. Apply database migrations.

> **NOTE**: Steps 3. and 4. are completed simultaneously.

#### Creating New Deployment

> **NOTE**: Due to name limits of resources in k8s the length of the branch name is limited to 55 characters. See [#52](https://github.com/jlab-sensing/DirtViz/issues/52) for more information.

Whenever a new branch on Github is created a new development environment with a separate database on the postgresql server and separate resources on k8s under a namespace that follows that of the branch. For example if a new branch is created with the name `test-branch`, a new postgres database is created with the name `test-branch` and a new k8s namespace is created with the name `dirtviz-test-branch`. The postgres database is created under the `DB_USER` defined in github secrets. The follows is the order of jobs run when a new branch is created:

1. Create k8s namespace 
2. Create new database
3. Populate database with temporary data

Access to the running containers are available from the following paths. Internally, the deployment leverages the [NGINX Ingress Controller](https://github.com/kubernetes/ingress-nginx) to setup paths.

| Service | Path |
|---------|------|
|portal|https://localhost/dirtviz/BRANCH/portal/|
|cs-http|https://localhost/dirtviz/BRANCH/cs-http/|
|http-api|https://localhost/dirtviz/BRANCH/http-api/|

It is recommended to have a external (aka non k8s) nginx instance to forward traffic to production and development environments and simplify handling of ssl certificates. The following is a sample nginx configuration to do exactly this.

```
server {
	listen 443 ssl default_server;
	server_name YOUR_HOSTNAME;

	include snippets/ssl.conf;

	#access_log  /tmp/bokeh.access.log;
	#error_log   /tmp/bokeh.error.log debug;

	location / {
		proxy_pass http://127.0.0.1:6080/dirtviz/main/portal/;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection "upgrade";
		proxy_http_version 1.1;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header Host $host:$server_port;
		proxy_buffering off;
	}	
	
	location /integrations/ {
		proxy_pass http://127.0.0.1:6080/dirtviz/main/;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection "upgrade";
		proxy_http_version 1.1;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header Host $host:$server_port;
		proxy_buffering off;
	}	

	location /dev/ {
		proxy_pass http://127.0.0.1:6080/dirtviz/;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection "upgrade";
		proxy_http_version 1.1;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header Host $host:$server_port;
		proxy_buffering off;
	}
}
```


## Integrations

Currently there are two integrations that allow for data to uploaded to the database.

### Chirpstack

Chirpstack handles data uploaded via the [LoRa](https://en.wikipedia.org/wiki/LoRa) protocol which works over extremely long ranges. The Chirpstack integration makes use of the HTTP integration that is a part of the Chirpstack software package. More information can be found at [https://www.chirpstack.io/application-server/integrations/http/](https://www.chirpstack.io/application-server/integrations/http/). Below is an example configuration within Chirpstack.

![Chirpstack HTTP Integration Configuration](.github/assets/img/screenshot_cs.png)

### HTTP

The HTTP integration is currently under development and will be changed significantly coming soon. Clients connected over Ethernet can send HTTP POST request to `http://localhost:8090` in CSV format. See the source code for formatting.


## FAQ

### How do I create database migrations?

This projects makes use of [alembic](https://alembic.sqlalchemy.org/en/latest/) to handle database migrations. It is recommended to have a understanding of the package first before attempting to modify the database schema. Due to the way that alembic handles package imports, the config file needs to be specified while running from the root project folder. For example the following will autogenerate new migrations from the latest revision of the database.

> **NOTE:** Autogeneration of migrations requires a running version of the database. Refer above to see how to create and connect to a local version of the database

```bash
# Migrate to latest version
alembic -c dirtviz/db/alembic.ini upgrade head
# Autogenerate migration
alembic -c dirtviz/db/alembic.ini revision --autogenerate -m "<MIGRATION MESSAGE>"
# Run generated migration
alembic -c dirtviz/db/alembic.ini upgrade head
```

### How do I reset the local database?

Sometime the database breaks and causes errors. Usually deleting the docker volume `postgresqldata` causing the database to be recreated fixes the issue. The following does exactly that and reapplies the migrations to the cleaned database.

```bash
docker compose down
docker volume rm dirtviz_postgresqldata
alembic -c dirtviz/db/alembic.ini upgrade head
docker compose up --build -d
```

### How do I import my own TEROS and Rocketlogger data previously collected?

There exists csv importers that can be used to populate the database. Python utilities currently exist to import RocketLogger and TEROS data. These are available as modules under dirtviz. More information on used can be found by running the modules with the `--help` flag.

```bash
python -m dirtviz.db.utils.import_rl_csv
python -m dirtviz.db.utils.import_teros_csv
```
