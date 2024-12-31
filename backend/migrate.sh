#!/bin/sh

# Date: 02/11/24
# Author: Aaron Wu
# This aggergates all the necessary alembic migration commands

# Note: migration commands
# flask --app api db init -d ./api/migrations
# flask --app api db stamp head -d ./api/migrations
# flask --app api db migrate -d ./api/database/migrations
# flask --app api db revision -d ./api/database/migrations --autogenerate -m "updated db"
# flask --app api db upgrade head -d ./api/database/migrations
# flask --app api db downgrade <version> -d ./api/migrations
# flask --app api db check -d ./api/migrations

USAGE="script usage: $(basename $0) [-u] [-m <msg>] [-d <ver>] [-c] [-v] [-h]"

if (( $# == 0 )); then
	echo $USAGE
	exit 1
fi


while getopts 'um:d:chv' FLAG
do
    case "$FLAG" in
		u)
			# upgrades to lastest alembic version
			flask --app api db upgrade head -d ./api/migrations
			;;
    m)  
			# Migrate database
			msg="$OPTARG"
			# read -p "Enter migrate message: " msg;
			flask --app api db migrate -d ./api/migrations -m "$msg";
			flask --app api db upgrade head -d ./api/migrations
			;;
		d)
			# Downgrade to another alembic version
			ver="$OPTARG"
			# read -p "Enter downgrade version: " ver;
			flask --app api db downgrade $ver -d ./api/migrations
			;;
		c)
			# Checks if database needs migration
			flask --app api db check -d ./api/migrations
			;;
		h)
			# Usage help
			echo $USAGE >&2
			exit 1
			;;
		v) 
			# Version
			flask --app api db current -d ./api/migrations 
			;;
		?)
			# Invalid flag
			echo $USAGE >&2
			exit 1
			;;
    esac
done

