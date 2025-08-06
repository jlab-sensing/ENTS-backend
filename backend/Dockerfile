# Development image
# The development image expects the backend code to be mounted into the
# container at /home/app/. This allows for hot reloading of the code for live
# updates of the website.
FROM python:3 AS development
WORKDIR /app/backend/
COPY requirements.txt ./
# Ensure entrypoint.sh is copied into the image
COPY entrypoint.sh /app/entrypoint.sh

RUN pip3 install --upgrade pip
RUN pip3 install -r requirements.txt
ENV FLASK_DEBUG=1
ENV FLASK_RUN_HOST=0.0.0.0
ENV FLASK_APP=api
COPY . ./
WORKDIR /app/
EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh", "-d"]

# Base image
# The base image contains the necessary dependencies to run the backend code.
# It installs the necessary apt packages and installs the python dependencies. A new
# user, "app", is created to run the code unprivileged.
FROM python:3 AS base
# set environment variables to have python print to stdout
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc qtbase5-dev-tools qt5-default qt5-qmake python3-pyqt5

# install python dependencies
COPY requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt
#RUN pip wheel --no-cache-dir --no-deps --wheel-dir /usr/src/app/wheels -r requirements.txt

# create new user and group to run the app with name "app"
RUN adduser --system --group app
USER app
WORKDIR $HOME

# copy files from source tree
COPY . .


# Production image
# The production images runs the flask api code. The container has all the
# bacend code and dependencies installed. The code is run as the "app" user.
FROM base AS production

ENTRYPOINT ["./entrypoint.sh", "-p"]


# Development worker image
# The developmet celery worker image is used to run the worker code in a development
# with additional debug printouts and development dependencies. The backend
# codebase should be mounted into the container at /home/app/ to allow for hot
# reloading of the code.
FROM base AS devworker

# install development dependencies
COPY requirements-dev.txt /tmp/requirements-dev.txt
RUN pip install --no-cache-dir -r /tmp/requirements-dev.txt

# set environment variables
ENV FLASK_DEBUG=1
ENV FLASK_RUN_HOST=0.0.0.0
ENV FLASK_APP=api

# default tries to process task before quiting (warm shutdown)
# instead terminate instantly so when AWS kills the worker
# the task is put back into queue
# https://github.com/sayanarijit/remap-sigterm
ENV REMAP_SIGTERM SIGQUIT

EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh", "-w", "dev"]


# Production working image
# The production celery worker image .
FROM base AS prodworker

# default tries to process task before quiting (warm shutdown)
# instead terminate instantly so when AWS kills the worker
# the task is put back into queue
# https://github.com/sayanarijit/remap-sigterm
ENV REMAP_SIGTERM SIGQUIT

EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh", "-w", "prod"]


FROM base AS migration

ENTRYPOINT ["./migrate.sh", "-u"]
