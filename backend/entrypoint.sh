#!/bin/sh

# run in dev or prod
while getopts 'dpw' FLAG
do
    case "$FLAG" in
        d) flask --app backend.wsgi --debug run -h 0.0.0.0 -p 8000;;
        p) gunicorn --worker-class gevent -c ./backend/gunicorn.conf.py -b :8000 backend.wsgi:handler;;
        w) celery -A backend.make_celery worker --loglevel INFO;;
    esac
done



