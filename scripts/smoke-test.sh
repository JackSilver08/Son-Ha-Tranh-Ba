#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${1:-http://localhost:8080}"
for path in /api/health /api/health/db /api/simulation/status /; do
  code="$(curl -sS -o /dev/null -w '%{http_code}' "${BASE_URL}${path}")"
  if [[ "$code" != "200" ]]; then
    echo "FAIL ${path}: HTTP ${code}" >&2; exit 1
  fi
  echo "PASS ${path}"
done
echo 'HTTP smoke test OK; check SignalR and PixiJS in the browser.'
