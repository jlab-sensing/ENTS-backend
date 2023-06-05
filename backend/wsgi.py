"""WSGI module

Deploys on gunicorn

"""
from . import api


handler = api.create_app()


if __name__ == '__main__':
    api.create_app().run(host='0.0.0.0', port=8000, debug=True)
