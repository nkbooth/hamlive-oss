# Production .env template for nets.n1cck.radio — rendered by `op inject` in CI
# (see .github/workflows/deploy.yml) and shipped to gondor:~/services/hamlive/.env.
#
# The 1Password secret references resolve against the vault "hamlive-prod" using
# the service account whose token lives in the OP_SERVICE_ACCOUNT_TOKEN GitHub secret.
# This file is safe to commit: it contains references, never secret values.
#
# CI appends IMAGE_TAG=sha-<shortsha> at deploy time to pin the image version
# (deploy/compose.prod.yml references ${IMAGE_TAG:-latest}).

# ---- Core ----
NODE_ENV=production
PORT=3000
APP_NAME=Ham.Live @ N1CCK
BASE_URL=https://nets.n1cck.radio
# TLS terminates at Caddy (on the `routing` host); redirect plain HTTP there.
FORCE_HTTPS=true
LOG_LEVEL=info
# Mongo runs in the same compose project (single-node replica set).
MONGODB_URI=mongodb://mongo:27017/hamlive?directConnection=true
COOKIE_SESSION_KEY=op://hamlive-prod/app/cookie-session-key
MAGIC_LINK_SECRET=op://hamlive-prod/app/magic-link-secret

# ---- Email (SMTP relay) ----
EMAIL_FROM=Ham.Live @ N1CCK <no-reply@n1cck.radio>
SMTP_HOST=op://hamlive-prod/smtp/host
SMTP_PORT=587
SMTP_USER=op://hamlive-prod/smtp/username
SMTP_PASS=op://hamlive-prod/smtp/password
SMTP_SECURE=false

# ---- Google OAuth ----
GOOGLE_CLIENT_ID=op://hamlive-prod/google-oauth/client-id
GOOGLE_CLIENT_SECRET=op://hamlive-prod/google-oauth/client-secret

# ---- GetStream chat (disabled for now; chat degrades gracefully) ----
# To re-enable: create the getstream vault item, then uncomment.
# STREAM_API_KEY=op://hamlive-prod/getstream/api-key
# STREAM_API_SECRET=op://hamlive-prod/getstream/api-secret

# ---- QRZ callsign lookup ----
QRZ_USERNAME=op://hamlive-prod/qrz/username
QRZ_PASSWORD=op://hamlive-prod/qrz/password

# ---- Azure Maps reverse geocoding (disabled for now; location resolution skipped) ----
# To re-enable: create the azure-maps vault item, then uncomment.
# GEO_KEY=op://hamlive-prod/azure-maps/geo-key

# ---- Analytics (self-hosted Plausible; cookieless) ----
ANALYTICS_ENABLED=true
PLAUSIBLE_DOMAIN=nets.n1cck.radio
PLAUSIBLE_SRC=https://analytics.n1cck.us/js/script.js

# ---- Footer support link ----
SUPPORT_URL=https://ko-fi.com/alatartheblue
SUPPORT_LABEL=Support this site
