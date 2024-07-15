"""Celery worker

Runs tasks in parallel

"""

from .api import create_app

handler = create_app()
celery_app = handler.extensions["celery"]