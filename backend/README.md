# DirtViz API

## Introduction

The DirtViz api is built using the [Flask](https://flask.palletsprojects.com/en/3.0.x/) factory app pattern. All modules revolve around the running Flask context. 

## API Reference

The DirtViz API is organized around [REST](https://en.wikipedia.org/wiki/REST). The API uses predictable resource-oriented URLs, accepts [form-encoded](https://en.wikipedia.org/wiki/POST_(HTTP)#Use_for_submitting_web_forms) request bodies, returns JSON-encoded responses, and uses standard HTTP response codes, authentication, and verbs.

The DirtViz API doesn’t support bulk updates. You can work on only one object per request. I.e., one data point can be updated per request.

## Authentication

The DirtViz platform handles users authentication using a [refresh token flow](https://cloudentity.com/developers/basics/oauth-grant-types/refresh-token-flow/). Users are given an access token to the API and a refresh token to designate access time. Currently, still under construction

For external devices DirtViz plans utilize API Keys to authenticate requests

The authentication module is located under `auth`

## Resources

DirtViz utilizes [flaskRESTful](https://flask-restful.readthedocs.io/en/latest/) to abstract construction of a REST Api. Endpoints are imported into the app when the app is created and are stored under the `resources` folder

Resource authentication is handled by utilzing a [resource decorator](https://marshmallow.readthedocs.io/en/stable/quickstart.html#declaring-schemas) to control access to an endpoint

## Validation

For validatiaon, DirtViz utilizes [marshmallow](https://marshmallow.readthedocs.io/en/stable/index.html) to check if the request is formmated correctly and with the correct types. [Schemas](https://marshmallow.readthedocs.io/en/stable/quickstart.html#declaring-schemas) are created under the `schemas` folder and imported into various resources as needed.

## Async Workers

To handle long running tasks, DirtViz uses [Celery](https://docs.celeryq.dev/en/stable/getting-started/introduction.html) as a task queue and [Redis](https://redis.io/) as a message broker. A Celery worker configuration is handled under `backend/__init__.py` and is built under a seperate flag in the dockerfile named, prodworker and devworker.

## Testing

Testing is conducted using [pytest](https://github.com/pytest-dev/pytest) and [testing fixtures](https://flask.palletsprojects.com/en/3.0.x/testing/) are spun up within the factory app pattern.

## Build

For development builds, Fl

## Production

To support the demands of deployment, DirtViz utilizes [gunicorn](https://gunicorn.org/) as a WSGI HTTP server. The configuration is located at `gunicorn.conf.py`. Gunicorn workers at set to scale according to `CPU_COUNT * 2 + 1` as per [gunicorn docs](https://docs.gunicorn.org/en/latest/design.html#how-many-workers). Monkey patching is also done for performace, which is patched before gunicorn. **Note: additional librarys need monkey patching support or you may encounter unintended errors**



