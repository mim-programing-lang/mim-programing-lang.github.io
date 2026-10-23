#!/usr/bin/env bash
# اختبارات الملعب في حاوية فيها Xvfb (الصورة نفسها التي يستعملها اختبار الاتجاه). لا شيء على سطح المكتب.
#   PG_MODE=noapi bash scripts/playground-test-container.sh   (على بناء بلا PUBLIC_PLAYGROUND_API)
#   PG_MODE=api   bash scripts/playground-test-container.sh   (على بناء بـ PUBLIC_PLAYGROUND_API=http://127.0.0.1:8788/run)
set -euo pipefail
site="$(cd "$(dirname "$0")/.." && pwd)"
node_dir="$(dirname "$(dirname "$(command -v node)")")"
pw_cache="${PLAYWRIGHT_BROWSERS_PATH:-$HOME/.cache/ms-playwright}"
exec podman run --rm --network=none --memory=1500m \
  -v "$site:/site:ro" -v "$node_dir:/opt/node:ro" -v "$pw_cache:/ms-playwright:ro" \
  -e PLAYWRIGHT_BROWSERS_PATH=/ms-playwright -e HOME=/tmp -e PG_MODE="${PG_MODE:-noapi}" \
  -e CHROMIUM_BIN="${CHROMIUM_IN_CONTAINER:-/ms-playwright/chromium-1208/chrome-linux64/chrome}" \
  --entrypoint sh "${BIDI_IMAGE:-localhost/meem-site-bidi}" -c '
    Xvfb :78 -screen 0 1400x900x24 -nolisten tcp >/dev/null 2>&1 &
    sleep 1
    cd /site && DISPLAY=:78 /opt/node/bin/node scripts/playground-test.mjs'
