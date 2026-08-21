#!/bin/sh
set -e

# BASE_PATH: alamtee, nt /mangud  (tühi = juur)
# PB_PUBLIC_URL: PocketBase brauseri jaoks, nt /mangud/pb või http://host:8090
BASE_PATH="${BASE_PATH:-}"
PB_URL="${PB_PUBLIC_URL:-}"

if [ -z "$PB_URL" ]; then
  if [ -n "$BASE_PATH" ]; then
    # proksi sama hosti all
    PB_URL="${BASE_PATH}/pb"
  else
    PB_URL="/pb"
  fi
fi

# Strip trailing slash from base
BASE_PATH=$(echo "$BASE_PATH" | sed 's|/$||')

cat > /usr/share/nginx/html/env.js << ENVEOF
window.__APP_CONFIG__ = {
  basePath: "${BASE_PATH}",
  pbUrl: "${PB_URL}",
};
window.__BASE_PATH__ = "${BASE_PATH}";
window.__PB_URL__ = "${PB_URL}";
ENVEOF

echo "Config: basePath=${BASE_PATH:-/} pbUrl=${PB_URL}"
exec "$@"
