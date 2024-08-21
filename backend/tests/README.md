# Testing Guide

## Run backend testing suite

To run tests

```console
$pytest
```

To run tests with coverage

```console
$pytest --cov
```

## Infrastructure

This is ENTS backend current API testing suite

- [pytest](https://docs.pytest.org/en/stable/) as testing framework

- [pytest-postgresql](https://github.com/ClearcodeHQ/pytest-postgresql) as a postgres fixtures library

## Configuration

The testing pipeline is configured from `conftest.py`. In the file there's various fixtures for different contexts within the application itself. Check out Flask docs on [fixtures](https://flask.palletsprojects.com/en/3.0.x/testing/) for more information.

## Structure

Tests are denoted by `test_NAME_OF_TEST.py` as definded by [pytest practices](https://docs.pytest.org/en/stable/explanation/goodpractices.html). At the moment, with the low volume of tests, tests reside in the `backend/tests` folder.
