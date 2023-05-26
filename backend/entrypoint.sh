#!/bin/sh

# apply migrations
flask --app backend.api db migrate -d ./backend/api/migrations
flask --app backend.api db upgrade head -d ./backend/api/migrations

# run in dev or prod
while getopts 'dp' FLAG
do
    case "$FLAG" in
        d) flask --app backend.api --debug run -p 8000;;
        p) gunicorn -b :8000 backend.wsgi:handler;;
    esac
done



