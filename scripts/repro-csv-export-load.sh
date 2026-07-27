#!/usr/bin/env bash
# Reproducible local load / misalignment helpers for frontend CSV export (#468 / #797).
#
# Unit tests already cover:
#   - 50k-point synthetic export budget (dashboardCsv.test.js)
#   - misaligned timestamps → NAN (dashboardCsv.test.js)
#   - s:{id} DB sensor panels from #795 (dashboardCsv.test.js)
#
# This script is for optional end-to-end verification against a running stack.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env}"
CELL_ID="${CELL_ID:-1}"
API_URL="${API_URL:-http://backend:8000/api/sensor/}"

usage() {
  cat <<'EOF'
Usage:
  ./scripts/repro-csv-export-load.sh seed          # SQL demo cells (power/teros/bme280/co2, ~48h)
  ./scripts/repro-csv-export-load.sh large         # denser SQL points for cell 1 (~30 days @ 1 min)
  ./scripts/repro-csv-export-load.sh misalign      # two ents batch uploads with different clocks
  ./scripts/repro-csv-export-load.sh unit          # run reproducible vitest suite

Env:
  ENV_FILE=.env   CELL_ID=1   API_URL=http://backend:8000/api/sensor/
EOF
}

cmd_seed() {
  docker compose exec -T postgresql psql -U dirtviz -d dirtviz < scripts/seed-demo-cells.sql
}

cmd_large() {
  docker compose exec -T postgresql psql -U dirtviz -d dirtviz <<'SQL'
INSERT INTO logger (id, name, uuid, type, date_created)
VALUES (1, 'Logger-001', gen_random_uuid(), 'demo', NOW())
ON CONFLICT (id) DO NOTHING;

DELETE FROM power_data WHERE cell_id = 1;
INSERT INTO power_data (logger_id, cell_id, ts, voltage, current)
SELECT
  1,
  1,
  (NOW() - INTERVAL '30 days') + (n * INTERVAL '1 minute'),
  12.0 + 0.2 * sin(n::double precision / 60.0),
  2.0 + 0.1 * cos(n::double precision / 45.0)
FROM generate_series(0, 60 * 24 * 30) AS n;

SELECT COUNT(*) AS power_rows FROM power_data WHERE cell_id = 1;
SQL
  echo "Large power series loaded for cell 1. Open dashboard, select Cell-001, Export to CSV."
}

cmd_misalign() {
  # Two batch windows that do not share the same timestamps → charts/CSV should NAN-align.
  docker compose --profile upload run --rm \
    -e ENV_FILE="$ENV_FILE" \
    upload-batch-voltage \
    ents sim_generic batch -v \
      --url "$API_URL" \
      --sensor POWER_VOLTAGE \
      --cell "$CELL_ID" \
      --logger 1 \
      --start 2026-03-01 \
      --end 2026-03-05 \
      --freq 3600

  docker compose --profile upload run --rm \
    -e ENV_FILE="$ENV_FILE" \
    upload-batch-bme280 \
    ents sim_generic batch -v \
      --url "$API_URL" \
      --sensor BME280_TEMP \
      --cell "$CELL_ID" \
      --logger 1 \
      --start 2026-03-01T00:30:00 \
      --end 2026-03-05T00:30:00 \
      --freq 3600

  echo "Uploaded two series offset by 30 minutes. Export CSV and confirm NAN gaps."
}

cmd_unit() {
  (cd frontend && npm test -- --run src/pages/dashboard/catalog/dashboardCsv.test.js)
}

case "${1:-}" in
  seed) cmd_seed ;;
  large) cmd_large ;;
  misalign) cmd_misalign ;;
  unit) cmd_unit ;;
  *) usage; exit 1 ;;
esac
