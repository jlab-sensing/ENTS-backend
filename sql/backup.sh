#!/bin/bash

set -x

TIMESTAMP=$(date +%Y%m%d%H%M%S)
BACKUP_FOLDER=~/backups
BACKUP_FILE=dirtviz_db_backup_${TIMESTAMP}.sql.gz 

# create folder
if [[ ! -e $BACKUP_FOLDER ]]; then
	mkdir -p $BACKUP_FOLDER
fi

pg_dump -c dirtviz | gzip > ${BACKUP_FOLDER}/${BACKUP_FILE}

rclone sync $BACKUP_FOLDER DirtvizBackups:/
