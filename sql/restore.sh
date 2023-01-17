#!/bin/bash

# Debugging
set -x

gunzip -c $1 | psql main
