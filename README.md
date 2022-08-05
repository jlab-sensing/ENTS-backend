# DirtViz
DirtViz is a project to visualize data collected from sensors deployed in sensor networks. The project involves developing web based plotting scripts to create a fully-fledged DataViz tool tailored to the data collected from embedded systems sensor networks.

Why Bokeh ?

Bokeh is a Python library for creating interactive visualizations for modern web browsers.



Working:

bokeh.models : A low level interface that provides high flexibility to application developers.
bokeh.plotting : A high level interface for creating visual glyphs.

Prerequisite and Installation:

pip install bokeh

## Setting up the Portal

The DirtViz application is designed to be run from docker. There are multiple container that all need to work together to the end user website up. Luckily for you all of it is defined within the `docker-compose.yml` file. Run the following command to start all the containers.

```
docker compose up -d
```

> If you get the following error `network chirpstack-external declared as external, but could not be found`


When adding functionality to the website there is a need to have sample data so that the graphs displayed are not blank. There is data included in the repo and can be imported using the `import_example_data.py` script. It is recommended to run the script from outside the container using the commands listed below to setup a virtual environment, install the necessary packages, and import the data. Due to the way docker mounts function, it is far quicker to import the data over a TCP connection to the postgresql container rather than mounting folder containing the data within the container. The other option would be to add the data to the dirtviz image, but that would increase the image size considerably. For now this is the best option as this functionality is not required in a production environment.

```
export DB_URL=postgresql://dirtviz:password@postgresql/dirtviz
python3 -m venv .venv
source .venv/bin/activate
./import_example_data.py
```
