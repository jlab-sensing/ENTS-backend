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

# Refuse to install into a directory that other users can write to or that is
# owned by someone else, since they could swap the downloaded files.
if [ ! -O . ]; then
    echo "Error: $(pwd) is not owned by the current user." >&2
    exit 1
fi
case "$(ls -ld . | cut -c9)" in
    w|t|s)
        echo "Error: $(pwd) is writable by other users. Run 'chmod o-w' on it or choose another DIR." >&2
        exit 1
        ;;
esac

# Download to a private temporary file and move it into place only on success,
# so a failed download never leaves a partial file behind.
tmp=""
trap 'rm -f "$tmp"' EXIT INT TERM
download() {
    tmp="$(mktemp ./.download.XXXXXX)"
    if fetch "$1" "$tmp"; then
        chmod 644 "$tmp"
        mv "$tmp" "$2"
        tmp=""
    else
        echo "Error: failed to download $1" >&2
        exit 1
    fi
}

echo "Downloading docker-compose.yml"
download "${BASE_URL}/docker-compose.release.yml" docker-compose.yml

if [ -f .env ]; then
    echo "Found existing .env, leaving it unchanged"
else
    echo "Downloading .env"
    download "${BASE_URL}/.env.example" .env
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

Use ENTS_VERSION=<version without leading v> to pin a release, and 'docker compose --profile pgadmin up -d'
to also start pgAdmin on http://localhost:8888.
EOF
