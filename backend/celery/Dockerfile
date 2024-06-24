FROM python:3.11.0-slim-buster as development
WORKDIR /app/backend/
COPY requirements.txt ./
RUN pip3 install --upgrade pip
RUN pip3 install -r requirements.txt

ENV DB_USER=dirtviz
ENV DB_PASS=password
ENV DB_HOST=postgresql
ENV DB_PORT=5432
ENV DB_DATABASE=dirtviz
ENV CELERY_BROKER_URL=redis://redis:6379/0
ENV CELERY_RESULT_BACKEND=redis://redis:6379/0

COPY . ./
WORKDIR /app/
RUN celery -A backend.make_celery worker --loglevel INFO

FROM python:3.11.0-slim-buster as builder

# set work directory
WORKDIR /usr/src/app

# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc

# lint
# RUN pip install --upgrade pip
# RUN pip install flake8==5.0.4
# COPY . /usr/src/app/
# RUN flake8 --ignore=E501,F401 .


# install python dependencies
COPY requirements.txt ./
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /usr/src/app/wheels -r requirements.txt

# entrypoint script
COPY entrypoint.sh ./

# gunicorn configuration
COPY gunicorn.conf.py ./

RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.11.0-slim-buster as production

# create directory for the app user
RUN mkdir -p /home/app

# create the app user
RUN addgroup --system app && adduser --system --group app

# set AWS args
ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY
ARG AWS_DEFAULT_REGION
# -- AWS RDS vars -- #
# ARG POSTGRES_USER
# ARG POSTGRES_PW
# ARG POSTGRES_URL
# ARG POSTGRES_DB


# -- Postgres vars -- #
ARG DB_USER
ARG DB_PASS
ARG DB_HOST
ARG DB_PORT
ARG DB_DATABASE

# -- Auth vars -- #
ARG SECRET_KEY
ARG ACCESS_TOKEN_SECRET
ARG REFRESH_TOKEN_SECRET
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG OAUTH_REDIRECT_URI
ARG CLIENT_URL

# -- env -- #

ENV DB_USER $DB_USER
ENV DB_PASS $DB_PASS
ENV DB_HOST $DB_HOST
ENV DB_PORT $DB_PORT
ENV DB_DATABASE $DB_DATABASE

ENV AWS_ACCESS_KEY_ID $AWS_ACCESS_KEY_ID
ENV AWS_SECRET_ACCESS_KEY $AWS_SECRET_ACCESS_KEY
ENV AWS_DEFAULT_REGION $AWS_DEFAULT_REGION

ENV SECRET_KEY $SECRET_KEY
ENV ACCESS_TOKEN_SECRET $ACCESS_TOKEN_SECRET
ENV REFRESH_TOKEN_SECRET $REFRESH_TOKEN_SECRET
ENV GOOGLE_CLIENT_ID $GOOGLE_CLIENT_ID
ENV GOOGLE_CLIENT_SECRET $GOOGLE_CLIENT_SECRET
ENV CLIENT_URL $CLIENT_URL
ENV OAUTH_REDIRECT_URI $OAUTH_REDIRECT_URI

# create the appropriate directories
ENV HOME=/home/app
ENV APP_HOME=/home/app/backend
RUN mkdir $APP_HOME
WORKDIR $APP_HOME

# install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends netcat
COPY --from=builder /usr/src/app/wheels /wheels
COPY --from=builder /usr/src/app/requirements.txt .
COPY --from=builder /usr/src/app/entrypoint.sh .
RUN pip install --upgrade pip
RUN pip install --no-cache /wheels/*

# copy project
COPY . $APP_HOME

# chown all the files to the app user
RUN chown -R app:app $APP_HOME

# change to the app user
USER app
WORKDIR /home/app/
RUN celery -A backend.make_celery worker --loglevel INFO
