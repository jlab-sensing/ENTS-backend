#!/bin/sh

# Date: 02/11/24
# Author: Aaron Wu
# This aggergates all the necessary alembic migration commands

# Note: migration commands
# flask --app backend.api db init -d ./backend/api/migrations
# flask --app backend.api db stamp head -d ./backend/api/migrations
# flask --app backend.api db migrate -d ./backend/api/database/migrations
# flask --app backend.api db revision -d ./backend/api/database/migrations --autogenerate -m "updated db"
# flask --app backend.api db upgrade head -d ./backend/api/database/migrations
# flask --app backend.api db downgrade <version> -d ./backend/api/migrations
# flask --app backend.api db check -d ./backend/api/migrations

USAGE="script usage: $(basename $0) [-u] [-m <msg>] [-d <ver>] [-c]"

if (( $# == 0 )); then
	echo $USAGE
	exit 1
fi


while getopts 'um:d:ch' FLAG
do
    case "$FLAG" in
		u)
			# upgrades to lastest alembic version
			flask --app backend.api db upgrade head -d ./backend/api/migrations
			;;
        m)  
			# Migrate database
			msg="$OPTARG"
			# read -p "Enter migrate message: " msg;
			flask --app backend.api db migrate -d ./backend/api/migrations -m "$msg";
			flask --app backend.api db upgrade head -d ./backend/api/migrations
			;;
		d)
			# Downgrade to another alembic version
			ver="$OPTARG"
			# read -p "Enter downgrade version: " ver;
			flask --app backend.api db downgrade $ver -d ./backend/api/migrations
			;;
		c)
			# Checks if database needs migration
			flask --app backend.api db check -d ./backend/api/migrations
			;;
		h)
			# Usage help
			echo $USAGE >&2
			exit 1
			;;
		?)
			# Invalid flag
			echo $USAGE >&2
			exit 1
			;;
    esac
done



