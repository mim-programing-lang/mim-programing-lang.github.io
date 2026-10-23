#!/usr/bin/env bash
# يشغّل اختبار الاتجاه داخل حاوية فيها Xvfb، بمتصفح يرسم على شاشة وهمية داخلها. لا شيء على سطح المكتب.
# الحاوية: localhost/meem-site-bidi (Xvfb ومكتبات Chromium؛ تُبنى بـ podman build -t localhost/meem-site-bidi -f scripts/bidi-test.Containerfile .)، ومجلد الموقع ومتصفح Playwright و node من الجهاز للقراءة فقط.
set -euo pipefail
site="$(cd "$(dirname "$0")/.." && pwd)"
node_dir="$(dirname "$(dirname "$(command -v node)")")"
pw_cache="${PLAYWRIGHT_BROWSERS_PATH:-$HOME/.cache/ms-playwright}"
image="${BIDI_IMAGE:-localhost/meem-site-bidi}"  # تُبنى من scripts/bidi-test.Containerfile
exec podman run --rm --network=none --memory=1500m \
  -v "$site:/site:ro" -v "$node_dir:/opt/node:ro" -v "$pw_cache:/ms-playwright:ro" \
  -e PLAYWRIGHT_BROWSERS_PATH=/ms-playwright -e HOME=/tmp -e CHROMIUM_BIN="${CHROMIUM_IN_CONTAINER:-/ms-playwright/chromium-1208/chrome-linux64/chrome}" \
  --entrypoint sh "$image" -c '
    Xvfb :77 -screen 0 1400x900x24 -nolisten tcp >/dev/null 2>&1 &
    sleep 1
    cd /site && DISPLAY=:77 /opt/node/bin/node scripts/bidi-test.mjs'
