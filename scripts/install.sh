#!/bin/sh
# Set up DirtViz from published container images, without cloning the repo.
#
#   curl -fsSL https://raw.githubusercontent.com/jlab-sensing/ENTS-backend/main/scripts/install.sh | sh
#
# Environment variables:
#   REPO  GitHub repository to download from (default: jlab-sensing/ENTS-backend)
#   REF   branch or tag to download from (default: main)
#   DIR   directory to install into (default: ./dirtviz)

set -eu

REPO="${REPO:-jlab-sensing/ENTS-backend}"
REF="${REF:-main}"
DIR="${DIR:-dirtviz}"
BASE_URL="${BASE_URL:-https://raw.githubusercontent.com/${REPO}/${REF}}"

if ! command -v docker >/dev/null 2>&1; then
    echo "Error: docker is required but was not found." >&2
    exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
    echo "Error: the docker compose plugin is required but was not found." >&2
    exit 1
fi

if command -v curl >/dev/null 2>&1; then
    fetch() { curl -fsSL "$1" -o "$2"; }
elif command -v wget >/dev/null 2>&1; then
    fetch() { wget -q "$1" -O "$2"; }
else
    echo "Error: curl or wget is required but neither was found." >&2
    exit 1
fi

mkdir -p "$DIR"
cd "$DIR"

echo "Downloading docker-compose.yml"
fetch "${BASE_URL}/docker-compose.release.yml" docker-compose.yml

if [ -f .env ]; then
    echo "Found existing .env, leaving it unchanged"
else
    echo "Downloading .env"
    fetch "${BASE_URL}/.env.example" .env
fi

cat <<EOF

DirtViz files are in: $(pwd)

Next steps:
  1. Review .env. The secrets in it are examples; generate new ones before
     exposing the site publicly (see the README), and add Google OAuth
     credentials if you want logins.
  2. Start the stack:
       cd "$DIR" && docker compose up -d
  3. Open http://localhost:3000

Use ENTS_VERSION=<tag> to pin a release, and 'docker compose --profile pgadmin up -d'
to also start pgAdmin on http://localhost:8888.
EOF
