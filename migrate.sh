#!/bin/sh

# apply migrations
# flask --app backend.api db init -d ./backend/api/migrations
# flask --app backend.api db stamp head -d ./backend/api/migrations
# flask --app backend.api db migrate -d ./backend/api/database/migrations
# flask --app backend.api db revision -d ./backend/api/database/migrations --autogenerate -m "updated db"
# flask --app backend.api db upgrade head -d ./backend/api/database/migrations

while getopts 'n' FLAG
do
    case "$FLAG" in
        n)  
			read -p "Enter migrate message: " msg;
			flask --app backend.api db migrate -d ./backend/api/migrations -m "$msg";
			;;
    esac
done
while
	flask --app backend.api db upgrade head -d ./backend/api/migrations
	[[ $? -ne 0 ]]
do true; done




