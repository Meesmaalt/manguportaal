#!/bin/sh
set -e

BASE_PATH="${BASE_PATH:-}"
PB_URL="${PB_PUBLIC_URL:-}"

BASE_PATH=$(echo "$BASE_PATH" | sed 's|/$||')

if [ -z "$PB_URL" ]; then
  # Default: same host, /pb under base (requires reverse-proxy)
  if [ -n "$BASE_PATH" ]; then
    PB_URL="${BASE_PATH}/pb"
  else
    PB_URL="/pb"
  fi
fi

cat > /usr/share/nginx/html/env.js << ENVEOF
window.__APP_CONFIG__ = {
  basePath: "${BASE_PATH}",
  pbUrl: "${PB_URL}"
};
window.__BASE_PATH__ = "${BASE_PATH}";
window.__PB_URL__ = "${PB_URL}";
console.info("[ohtu] basePath=${BASE_PATH:-/} pbUrl=${PB_URL}");
ENVEOF

echo "Config: basePath=${BASE_PATH:-/} pbUrl=${PB_URL}"
exec "$@"
