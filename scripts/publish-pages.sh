#!/usr/bin/env bash
# ينشر dist/ في فرع gh-pages بمستودع الموقع: إيداع يتيم واحد يحل محل السابق (الفرع مخرج بناء لا تاريخ له).
# لا يبني: شغّل npm run build قبله (انظر DEPLOY.md). الدفع بـ HTTPS عبر gh (credential helper)، لا SSH.
#
#   scripts/publish-pages.sh            يدفع
#   DRY_RUN=1 scripts/publish-pages.sh  يجهّز الشجرة ويطبع مكانها ولا يدفع
set -euo pipefail

REPO="${PAGES_REPO:-mim-programing-lang/mim-programing-lang.github.io}"
SITE_URL="${SITE_URL:-https://mim-programing-lang.github.io}"
root="$(cd "$(dirname "$0")/.." && pwd)"
dist="$root/dist"

[ -f "$dist/index.html" ] || { echo "لا dist/index.html: ابنِ أولاً (npm run build)." >&2; exit 1; }
# الموقع المبني يجب أن يكون لهذا العنوان، لا لعنوان المعاينة.
grep -q "rel=\"canonical\" href=\"$SITE_URL/\"" "$dist/index.html" || { echo "dist/ مبني لعنوان غير $SITE_URL (SITE_URL عند البناء)." >&2; exit 1; }

login="$(gh api user --jq .login)"
id="$(gh api user --jq .id)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

cp -a "$dist/." "$tmp/"
# _headers لاستضافة تقرأه (Cloudflare)، وCNAME يربط نطاقاً: لا هذا ولا ذاك في GitHub Pages الآن.
rm -f "$tmp/_headers" "$tmp/CNAME"
touch "$tmp/.nojekyll"

git -C "$tmp" init -q -b gh-pages
git -C "$tmp" add -A
GIT_AUTHOR_NAME="$login" GIT_AUTHOR_EMAIL="$id+$login@users.noreply.github.com" \
GIT_COMMITTER_NAME="$login" GIT_COMMITTER_EMAIL="$id+$login@users.noreply.github.com" \
  git -C "$tmp" commit -q -m "الموقع المبني ($(date -u +%Y-%m-%d))"

if [ -n "${DRY_RUN:-}" ]; then
  trap - EXIT
  echo "الشجرة جاهزة في $tmp ($(git -C "$tmp" ls-files | wc -l) ملفاً). لم يُدفع شيء."
  exit 0
fi
git -C "$tmp" push -q --force "https://github.com/$REPO.git" gh-pages:gh-pages
echo "دُفع gh-pages إلى $REPO."
