#!/bin/sh

# run in dev or prod
while getopts 'dp' FLAG
do
    case "$FLAG" in
        d)
            echo "Running Flask in debug mode"
            flask --app wsgi --debug run -h 0.0.0.0 -p 8000;;
        p) 
            echo "Running Gunicorn with gevent"
            exec gunicorn -c gunicorn.conf.py -w 1 wsgi:handler;;
        *)
           echo "Invalid flag specified" 
        ;;
    esac

done
