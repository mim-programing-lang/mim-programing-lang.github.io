# النشر على GitHub Pages

الموقع: **https://mim-programing-lang.github.io/**، من المستودع العام `mim-programing-lang/mim-programing-lang.github.io`
(مستودع موقع المستخدم: يُقدَّم من الجذر بلا مسار فرعي).

- الفرع `main`: المصدر.
- الفرع `gh-pages`: الموقع المبني (`dist/` ومعه `.nojekyll`)، إيداع يتيم واحد يُستبدل في كل نشر. منه تقدّم Pages
  (الإعداد: Source = Deploy from a branch، الفرع `gh-pages`، المجلد `/`).
- لا CI: الموقع يُبنى **محلياً**، لأن البناء يشغّل المجمّع الحقيقي (حزمته تطلب glibc 2.35 أو أحدث)، ويفشل إن خالف مثالٌ
  مخرجه المسجَّل، فلا يُنشر موقع لم يُتحقق منه.
- الدفع بـ HTTPS عبر `gh` (`gh auth setup-git`)، لا SSH.

## كل نشر

```sh
SITE_URL=https://mim-programing-lang.github.io \
MEEM_BIN=/مسار/إلى/meem-0.7.0-linux-x86_64/meem \
  nice -n 10 npm run build
scripts/publish-pages.sh
```

- `SITE_URL` يدخل في روابط `canonical` و`og:url` وخريطة الموقع و`robots.txt`. الافتراضي في `site.config.mjs` هو
  عنوان github.io نفسه؛ والسكربت يرفض `dist/` مبنياً لعنوان آخر.
- `MEEM_BIN`: المجمّع المنشور نفسه (الأمثلة المحلية تُشغَّل به). إن لم يُمرَّر فمن `.env`.
- `scripts/publish-pages.sh` يأخذ `dist/` كما هو، ويحذف منه `_headers` و`CNAME`، ويضيف `.nojekyll`، ويدفع إيداعاً يتيماً
  واحداً إلى `gh-pages` بمؤلف noreply الخاص بالحساب. `DRY_RUN=1` يجهّز الشجرة ولا يدفع.
- النشر يظهر خلال دقيقة أو اثنتين؛ حالته: `gh api repos/mim-programing-lang/mim-programing-lang.github.io/pages/builds/latest`.

تحديث المصدر: إيداع عادي على `main` ودفعه (`git push https://github.com/mim-programing-lang/mim-programing-lang.github.io.git main`).
لا يُدفع تاريخ المستودع المحلي القديم.

## التنزيلات

الملفات على GitHub Releases في المستودع نفسه (الوسم `v0.7.0`)، لا في `gh-pages`: الحزم أكبر من أن تُوضع في الموقع.

إصدار جديد:

1. `gh release create vX.Y.Z <الملفات> SHA256SUMS --repo mim-programing-lang/mim-programing-lang.github.io --title ... --notes ...`
   (`SHA256SUMS` واحد للملفات كلها).
2. نزّل كل ملف من رابطه العام وقارن بصمته بـ `sha256sum`.
3. املأ `src/data/downloads.json` بـ `scripts/make-downloads.mjs` من الملفات نفسها، والرابط بـ `--url`
   (`https://github.com/mim-programing-lang/mim-programing-lang.github.io/releases/download/<الوسم>/<الملف>`).
4. ابنِ وانشر.

## سياسة الأمان بلا رؤوس HTTP

GitHub Pages لا يتيح رؤوس HTTP مخصصة. لذلك تكتب الخطوة الأخيرة من البناء (`scripts/postbuild.mjs`) سياسة أمان المحتوى في
كل صفحة بوسم `<meta http-equiv="Content-Security-Policy">` أول الرأس:

`default-src 'none'; script-src 'self' 'wasm-unsafe-eval' <تجزئات السكربتات المضمَّنة في الصفحة>; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'`

(`'wasm-unsafe-eval'` و`connect-src 'self'` للبحث: Pagefind يعمل بـ WebAssembly ويقرأ فهرسه من الموقع.)

ما **لا** يُفرض بوسم meta، فلا يُفرض على GitHub Pages:

- `frame-ancestors` (منع تضمين الموقع في إطار عند غيره)، و`X-Frame-Options`.
- `X-Content-Type-Options: nosniff`، و`Referrer-Policy`، و`Permissions-Policy`.
- `report-uri`/`report-to`، و`sandbox`.
- HSTS تضعه GitHub نفسها لنطاق github.io؛ ولنطاق مخصص يُفعَّل «Enforce HTTPS» من الإعدادات.

وعلى استضافة تقرأ ملف `_headers` (Cloudflare Pages) يكتب البناء `dist/_headers` بالسياسة نفسها للملعب ومعها ما سبق.

## ربط النطاق meemlang.org لاحقاً (لم يُنفَّذ شيء منه)

**قبل ذلك:** المستودع القديم `mim-programing-lang/meemlang` مضبوط فيه النطاق `meemlang.org` لـ Pages (حتى 2026-10-23).
النطاق لا يُضبط لمستودعين معاً: أزله منه أولاً (إعدادات ذلك المستودع ← Pages ← Custom domain ← Remove)، أو عطّل Pages فيه.

1. **سجلات DNS** عند مسجّل النطاق:
   - للنطاق الجذر `meemlang.org`: أربعة سجلات `A` إلى `185.199.108.153` و`185.199.109.153` و`185.199.110.153`
     و`185.199.111.153`، ولـ IPv6 أربعة `AAAA` إلى `2606:50c0:8000::153` و`2606:50c0:8001::153` و`2606:50c0:8002::153`
     و`2606:50c0:8003::153` (تحقق منها في توثيق GitHub Pages وقت التنفيذ).
   - لـ `www.meemlang.org`: سجل `CNAME` إلى `mim-programing-lang.github.io`.
2. **التحقق من النطاق** (موصى به، يمنع غيرك من استعماله): إعدادات الحساب ← Pages ← Add a domain، وسجل `TXT` الذي تعطيه.
3. **في الموقع:**
   - `SITE_URL=https://meemlang.org` عند البناء (أو الافتراضي في `site.config.mjs`).
   - ملف `public/CNAME` سطره `meemlang.org`، **و**إزالة `CNAME` من قائمة الحذف في `scripts/publish-pages.sh`.
   - ابنِ وانشر.
4. **في المستودع:** Settings ← Pages ← Custom domain = `meemlang.org`، أو:

   ```sh
   gh api -X PUT repos/mim-programing-lang/mim-programing-lang.github.io/pages -f cname=meemlang.org
   ```

   ثم انتظر الشهادة وفعّل «Enforce HTTPS» (`-F https_enforced=true`).
5. تحقق:

   ```sh
   curl -sI https://meemlang.org/ | head -1
   curl -s https://meemlang.org/robots.txt
   curl -s https://meemlang.org/sitemap-index.xml | head -3
   curl -sI https://mim-programing-lang.github.io/ | grep -i location   # يحوّل إلى meemlang.org
   ```

## الملعب لاحقاً (لم يُنفَّذ شيء منه)

صفحة `/playground/` واجهة فقط، بحالة «قيد التجهيز». تعمل حين يوجد خادم تشغيل وعنوانه مضبوط عند البناء. GitHub Pages
موقع ثابت لا يشغّل شيئاً، فالخادم منفصل عنه. العقد في `docs/playground-api.md`، وتصميم الخادم وحدوده ونموذج تهديده في
`docs/playground.md` بمستودع المجمّع.

1. **خادم التشغيل** على نطاق مستقل (مثل `play.meemlang.org`) لا على نطاق الموقع: يشغّل المجمّع الحقيقي في حاوية معزولة
   لكل طلب، مع طابور وحد معدل لكل عنوان. الحدود: 8 ثوانٍ حائطاً، والشيفرة حتى 64 ك.ب، وجسم الطلب حتى 96 ك.ب (يرفض ما زاد
   بـ `413`)، والخرج 64 ك.ب، والخيارات `--no-unsafe --no-ffi --no-system --debug-mem`.
2. **المتغير عند البناء:**

   ```sh
   PUBLIC_PLAYGROUND_API=https://play.meemlang.org/run SITE_URL=... MEEM_BIN=... npm run build
   ```

   بلا المتغير تُبنى الصفحة «قيد التجهيز». معه تضيف سياسة أمان صفحة الملعب أصل هذا العنوان وحده إلى `connect-src`.
3. **CORS من جهة الخادم:** `Access-Control-Allow-Origin` بأصل الموقع وحده (لا `*`)، على رد `OPTIONS` (ومعه
   `Access-Control-Allow-Methods: POST` و`Access-Control-Allow-Headers: Content-Type` و`Access-Control-Max-Age`) وعلى رد
   `POST`. بلا ملفات تعريف، فلا `Access-Control-Allow-Credentials`. وحين يُربط النطاق يتغير الأصل.
4. **أمثلة ما بعد 0.7.0:** إن كان الخادم يشغّل حزمة من فرع التطوير فأضف `PUBLIC_PLAYGROUND_INCLUDE_DEV=1` عند البناء.

**الخادم الوهمي** (`scripts/playground-mock/`) للتطوير والاختبار على الجهاز وحده، ولا يدخل في `dist/` ولا يُنشر.

## بديل: Cloudflare Pages

إن نُقل الموقع إليها لاحقاً: `npx wrangler pages deploy dist --project-name <الاسم>`، وتُقرأ عندها `dist/_headers`
(تخزين طويل للخطوط وملفات `_astro`، ورؤوس الأمان للملعب).
