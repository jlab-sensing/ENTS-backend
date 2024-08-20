# ENTS Backend API

## Introduction

The ENTS backend API is built using the [Flask](https://flask.palletsprojects.com/en/3.0.x/) factory app pattern. All modules revolve around the running Flask context.

## API Reference

The ENTS backend API is organized around [REST](https://en.wikipedia.org/wiki/REST). The API uses predictable resource-oriented URLs, accepts [form-encoded](https://en.wikipedia.org/wiki/POST_(HTTP)#Use_for_submitting_web_forms) request bodies, returns JSON-encoded responses, and uses standard HTTP response codes, authentication, and verbs.

The ENTS backend API doesn’t support bulk updates. You can work on only one object per request. I.e., one data point can be updated per request.

## Authentication

The ENTS backend handles users authentication using a [refresh token flow](https://cloudentity.com/developers/basics/oauth-grant-types/refresh-token-flow/). Users are given an access token to the API and a refresh token to designate access time. Currently, still under construction

For external devices ENTS backend plans utilize API Keys to authenticate requests

The authentication module is located under `auth`

## Resources

ENTS backend utilizes [flaskRESTful](https://flask-restful.readthedocs.io/en/latest/) to abstract construction of a REST Api. Endpoints are imported into the app when the app is created and are stored under the `resources` folder

Resource authentication is handled by utilzing a [resource decorator](https://marshmallow.readthedocs.io/en/stable/quickstart.html#declaring-schemas) to control access to an endpoint

## Validation

For validatiaon, ENTS backend utilizes [marshmallow](https://marshmallow.readthedocs.io/en/stable/index.html) to check if the request is formmated correctly and with the correct types. [Schemas](https://marshmallow.readthedocs.io/en/stable/quickstart.html#declaring-schemas) are created under the `schemas` folder and imported into various resources as needed.

## Async Workers

To handle long running tasks, ENTS backend uses [Celery](https://docs.celeryq.dev/en/stable/getting-started/introduction.html) as a task queue and [Redis](https://redis.io/) as a message broker. A Celery worker configuration is handled under `backend/__init__.py` and is built under a seperate flag in the dockerfile named, prodworker and devworker.

## Testing

Testing is conducted using [pytest](https://github.com/pytest-dev/pytest) and [testing fixtures](https://flask.palletsprojects.com/en/3.0.x/testing/) are spun up within the factory app pattern. Flask uses the testing configuration as defined under `api/config.py`. The testing fixtures are defined under `tests/conftest.py`.

## Linting

Files are to be linted using [ruff](https://docs.astral.sh/ruff/).

After installing ruff run below to lint

```console
ruff check ./backend
```


## Formatting

Files are to be formatted using [black](https://github.com/psf/black).

After installing ruff run below to format

```console
black ./backend
```

## Docker Builds

There are two targets for building the api, `development` and `production`. In the development target, hot reload is avaliable as well as the running flask in developement mode (Debug logs print to stderr). In the production target, gunicorn is ran in front of flask and the env is set to production env vars.

## Production

To support the demands of deployment, ENTS backend utilizes [gunicorn](https://gunicorn.org/) as a WSGI HTTP server. The configuration is located at `gunicorn.conf.py`. Gunicorn workers at set to scale according to `CPU_COUNT * 2 + 1` as per [gunicorn docs](https://docs.gunicorn.org/en/latest/design.html#how-many-workers). Monkey patching is also done for performace, which is patched before gunicorn. **Note: additional librarys need monkey patching support or you may encounter unintended errors**



