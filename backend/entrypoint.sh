#!/bin/sh

# run in dev or prod
while getopts 'dp' FLAG
do
    case "$FLAG" in
        d) flask --app backend.wsgi --debug run -h 0.0.0.0 -p 8000;;
        p) gunicorn -c ./backend/gunicorn.conf.py -b :8000 backend.wsgi:handler;;
    esac
done



