#!/bin/bash

while
	alembic -c dirtviz/db/alembic.ini upgrade head
	[[ $? -ne 0 ]]
do true; done

bokeh serve dirtviz
