#!/bin/sh
# Regenerate env.js from environment variables on container start.
# nginx runs everything in /docker-entrypoint.d/ before starting the server.
set -eu

TARGET=/usr/share/nginx/html/env.js

cat > "$TARGET" <<EOF
// Generated at container start from environment variables. Do not edit.
window.__SP_ENV__ = {
  API_URL: "${API_URL:-}",
  SOCKET_URL: "${SOCKET_URL:-${API_URL:-}}",
  PATIENT_APP_URL: "${PATIENT_APP_URL:-}"
};
EOF

echo "[saathipill] portal env.js → API_URL=${API_URL:-<empty>} PATIENT_APP_URL=${PATIENT_APP_URL:-<empty>}"
