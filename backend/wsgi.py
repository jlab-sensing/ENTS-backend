"""WSGI module

Deploys on gunicorn

"""

from .api import create_app

handler = create_app()
celery_app = handler.extensions["celery"]


if __name__ == "__main__":
    handler.run(host="0.0.0.0", port=8000, debug=True)
