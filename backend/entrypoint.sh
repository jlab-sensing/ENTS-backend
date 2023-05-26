#!/bin/sh
flask --app backend.api db migrate -d ./backend/api/migrations
flask --app backend.api db upgrade head -d ./backend/api/migrations
flask --app backend.api --debug run -p 8000
