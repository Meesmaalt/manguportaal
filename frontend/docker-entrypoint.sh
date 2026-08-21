#!/bin/sh
set -e

# Runtime config: browser reaches PocketBase
# Prefer explicit PB_PUBLIC_URL, else same-origin proxy /pb
PB_URL="${PB_PUBLIC_URL:-}"
if [ -z "$PB_URL" ]; then
  PB_URL="/pb"
fi

cat > /usr/share/nginx/html/env.js << ENVEOF
window.__PB_URL__ = "${PB_URL}";
ENVEOF

echo "PocketBase URL for browser: ${PB_URL}"
exec "$@"
