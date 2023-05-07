FROM python:3.11.0-slim-buster as development
WORKDIR /app/backend/
COPY requirements.txt ./
RUN pip3 install --upgrade pip
RUN pip3 install -r requirements.txt
ENV FLASK_DEBUG=1
ENV FLASK_RUN_HOST=0.0.0.0
ENV FLASK_APP=api
COPY . ./
WORKDIR /app/
EXPOSE 8000
CMD ["flask", "--app", "backend.api", "--debug", "run", "-p", "8000"]
# CMD ["gunicorn", "-b", ":8000", "backend.app:app", "-c", "./backend/gunicorn_config.py"]

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

RUN pip install -r requirements.txt

FROM python:3.11.0-slim-buster as production

# create directory for the app user
RUN mkdir -p /home/app

# create the app user
RUN addgroup --system app && adduser --system --group app

# create the appropriate directories
ENV HOME=/home/app
ENV APP_HOME=/home/app/web
RUN mkdir $APP_HOME
WORKDIR $APP_HOME

# install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends netcat
COPY --from=builder /usr/src/app/wheels /wheels
COPY --from=builder /usr/src/app/requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache /wheels/*

# copy project
COPY . $APP_HOME

# chown all the files to the app user
RUN chown -R app:app $APP_HOME

# change to the app user
USER app
WORKDIR /home/app/
CMD ["gunicorn", "-b", ":8000", "web.app:app"]

# FROM python:3.10-slim as build
# RUN apt-get update
# RUN apt-get install -y --no-install-recommends \
# 	      build-essential gcc 

# WORKDIR /usr/app
# RUN python -m venv /usr/app/venv
# ENV PATH="/usr/app/venv/bin:$PATH"

# COPY requirements.txt .
# RUN pip install -r requirements.txt

# FROM python:3.10-slim@sha256:2bac43769ace90ebd3ad83e5392295e25dfc58e58543d3ab326c3330b505283d
# WORKDIR /usr/app/venv
# COPY --from=build /usr/app/venv ./venv
# COPY . .

# ENV PATH="/usr/app/venv/bin:$PATH"
# CMD [ "python", "app.py" ]