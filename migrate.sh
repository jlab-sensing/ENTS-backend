#!/bin/sh

# apply migrations
# flask --app backend.api db init -d ./backend/api/migrations
# flask --app backend.api db stamp head -d ./backend/api/migrations
# flask --app backend.api db migrate -d ./backend/api/database/migrations
# flask --app backend.api db revision -d ./backend/api/database/migrations --autogenerate -m "updated db"
# flask --app backend.api db upgrade head -d ./backend/api/database/migrations

# flask --app backend.api db downgrade c7c5894af080 -d ./backend/api/migrations
# flask --app backend.api db check -d ./backend/api/migrations

if (( $# == 0 )); then
    flask --app backend.api db upgrade head -d ./backend/api/migrations
    exit 1
fi

while getopts 'ndc' FLAG
do
    case "$FLAG" in
        n)  
			# Migrate database
			read -p "Enter migrate message: " msg;
			flask --app backend.api db migrate -d ./backend/api/migrations -m "$msg";
			flask --app backend.api db upgrade head -d ./backend/api/migrations
			;;
		d)
			# Downgrade to another alembic version
			read -p "Enter downgrade version: " ver;
			flask --app backend.api db downgrade "$ver" -d ./backend/api/migrations
			;;
		c)
			# Checks if database needs migration
			flask --app backend.api db check -d ./backend/api/migrations
			;;
    esac
done
# # while
# 	flask --app backend.api db upgrade head -d ./backend/api/migrations
# 	[[ $? -ne 0 ]]
# # do true; done




