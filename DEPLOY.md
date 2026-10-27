# النشر على GitHub Pages

الموقع: **https://meemlang.org/**، من المستودع العام `mim-programing-lang/mim-programing-lang.github.io` (مستودع موقع
المستخدم: يُقدَّم من الجذر بلا مسار فرعي). العنوان `https://mim-programing-lang.github.io/` يحوّل إليه.

- الفرع `main`: المصدر.
- الفرع `gh-pages`: الموقع المبني (`dist/` ومعه `.nojekyll`)، إيداع يتيم واحد يُستبدل في كل نشر. منه تقدّم Pages
  (الإعداد: Source = Deploy from a branch، الفرع `gh-pages`، المجلد `/`).
- لا CI: الموقع يُبنى **محلياً**، لأن البناء يشغّل المجمّع الحقيقي (حزمته تطلب glibc 2.35 أو أحدث)، ويفشل إن خالف مثالٌ
  مخرجه المسجَّل، فلا يُنشر موقع لم يُتحقق منه.
- الدفع بـ HTTPS عبر `gh` (`gh auth setup-git`)، لا SSH.

## كل نشر

```sh
SITE_URL=https://meemlang.org \
PUBLIC_PAYPAL_DONATE_URL=https://www.paypal.com/ncp/payment/SBZ3RJL5FWHME \
MEEM_BIN=/مسار/إلى/meem-0.9.0-linux-x86_64/meem \
  nice -n 10 npm run build
scripts/publish-pages.sh
```

- `SITE_URL` يدخل في روابط `canonical` و`og:url` وخريطة الموقع و`robots.txt`. الافتراضي في `site.config.mjs` هو
  `https://meemlang.org`؛ والسكربت يرفض `dist/` مبنياً لعنوان غير النطاق الذي في `CNAME`.
- `MEEM_BIN`: المجمّع المنشور نفسه (الأمثلة المحلية تُشغَّل به). إن لم يُمرَّر فمن `.env`.
- `scripts/publish-pages.sh` يأخذ `dist/` كما هو، ويحذف منه `_headers`، ويضيف `.nojekyll`، ويدفع إيداعاً يتيماً
  واحداً إلى `gh-pages` بمؤلف noreply الخاص بالحساب. `DRY_RUN=1` يجهّز الشجرة ولا يدفع.
- **`CNAME` يبقى في كل نشر.** `public/CNAME` (سطره `meemlang.org`) يُنسخ إلى `dist/CNAME` عند البناء، والسكربت يرفض
  النشر إن غاب: النشر يستبدل فرع `gh-pages` كله، وفرع بلا `CNAME` يفك ربط النطاق في إعدادات Pages. لا تحذف
  `public/CNAME` ما دام النطاق مربوطاً.
- النشر يظهر خلال دقيقة أو اثنتين؛ حالته: `gh api repos/mim-programing-lang/mim-programing-lang.github.io/pages/builds/latest`.

تحديث المصدر: إيداع عادي على `main` ودفعه (`git push https://github.com/mim-programing-lang/mim-programing-lang.github.io.git main`).
لا يُدفع تاريخ المستودع المحلي القديم.

## التنزيلات

الإصدارات في مستودع الموقع: `v0.7.0` (ميم 0.7.0 ومحرر ميم 0.1.0) و`v0.8.0` (ميم 0.8.0 ومحرر ميم 0.2.0) و`v0.9.0`
(ميم 0.9.0 ومحرر ميم 0.3.0)، والموقع يشير إلى الأحدث. الإصدار القديم يبقى كما هو.

**المجمّع الذي يبني الموقع:** فكّ أرشيف الإصدار نفسه في مجلد مؤقت ومرّر `meem` منه في `MEEM_BIN`
(`tar -xJf meem-0.8.0-linux-x86_64.tar.xz -C /مجلد/مؤقت`). المجلد `build/release/meem-linux-x86_64/` في مستودع المجمّع
قد يبقى على إصدار أقدم (كان 0.7.0 عند إصدار 0.8.0)، فتحقق بـ `meem --version` قبل البناء.

الملفات على GitHub Releases في المستودع نفسه (الوسم `v0.7.0`)، لا في `gh-pages`: الحزم أكبر من أن تُوضع في الموقع.

إصدار جديد:

1. `gh release create vX.Y.Z <الملفات> SHA256SUMS --repo mim-programing-lang/mim-programing-lang.github.io --title ... --notes ...`
   (`SHA256SUMS` واحد للملفات كلها).
2. نزّل كل ملف من رابطه العام وقارن بصمته بـ `sha256sum`.
3. املأ `src/data/downloads.json` بـ `scripts/make-downloads.mjs` من الملفات نفسها، والرابط بـ `--url`
   (`https://github.com/mim-programing-lang/mim-programing-lang.github.io/releases/download/<الوسم>/<الملف>`).
4. ابنِ وانشر.

## صفحة «جرّب 0.9 معنا» ورابط البلاغات

`/beta/` مكتوبة من `docs/beta-0.9.md` في مستودع المجمّع: ما يُطلب اختباره، وقالب البلاغ، وما هو معروف، ومعيار 1.0. رابط
البلاغات من `links.issues` في `site.config.mjs` (`src/components/IssuesLink.astro`)، **فارغ الآن**: تعرض الصفحة «قريباً» بلا
رابط. حين يُعطى اسم المستودع: ضع عنوان صفحة بلاغاته (`https://github.com/<الحساب>/<المستودع>/issues/new`) في
`links.issues`، ثم ابنِ وانشر. يظهر الرابط أيضاً في صفحة «حول المشروع» (`Links.astro`).

## التبرع (صفحة «دعم»)

`/support/` فيها زر «تبرّع عبر PayPal»: **رابط عادي** يُفتح في تبويب جديد (`target="_blank" rel="noopener noreferrer"`)،
لا سكربت PayPal المضمَّن. فلا يحمّل الموقع أي مورد من PayPal، ولا يتتبّع الزائر، ولا تتغير سياسة الأمان.

- **الضبط:** متغير البناء `PUBLIC_PAYPAL_DONATE_URL` (إعداد عام لا سر)، الرابط الكامل لزر PayPal المحفوظ. القيمة الحالية
  `https://www.paypal.com/ncp/payment/SBZ3RJL5FWHME` (نوع «الروابط والأزرار المحفوظة»). يُمرَّر في سطر أمر البناء
  (أعلاه)، أو في `.env`.
- **التحقق عند البناء:** `site.config.mjs` يرفض أي قيمة لا تبدأ بـ `https://www.paypal.com/`، فيفشل البناء.
- **التعطيل:** ابنِ والمتغير فارغ أو غائب (`PUBLIC_PAYPAL_DONATE_URL= npm run build`) ثم انشر. تُعرض الصفحة «قريباً»
  والزر معطّل، ولا يظهر رابط PayPal في أي صفحة.
- **الفحص الآلي** (`scripts/postbuild.mjs`، البند 10): يفشل البناء إن ظهر في الصفحات المبنية بريد، أو اسم أو حساب شخصي
  (بتجزئاتها في `scripts/lib/private-tokens.json`، لا بنصها)، أو مسار من جهاز البناء، أو أي مورد من PayPal غير الرابط
  (سكربت، صورة، إطار، نموذج)، أو رابط PayPal في غير `/support/` أو بلا `target`/`rel` المطلوبين؛ وبلا المتغير يفشل إن
  غاب «قريباً» أو لم يكن الزر معطّلاً.
- **اختبار الخصوصية المقترح (يدوياً، لم يُنفَّذ):** تبرّع بدولار واحد من حساب PayPal آخر غير الحساب المستلم، ثم راقب:
  1. صفحة الدفع: أنها على `www.paypal.com`، وأن المستلم واسمه المعروض كما تريد، وما تطلبه من الدافع.
  2. إيصال الدافع (البريد وسجل حسابه): ما يظهر فيه عن المستلم (الاسم، والبريد، وعنوان الحساب).
  3. ما يصل إلى الحساب المستلم عن الدافع.
  4. أن الموقع لا يعلم بشيء: لا طلب من صفحة الدعم إلى PayPal قبل الضغط (أدوات المطوّر ← الشبكة).
  وإن أظهرت PayPal بياناً شخصياً لا تريده فاضبطه من إعدادات الحساب المستلم، لا من الموقع.

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

## النطاق meemlang.org (مربوط منذ 2026-10-23)

ربطه صاحب المشروع من إعدادات Pages. الحالة الآن (`gh api repos/mim-programing-lang/mim-programing-lang.github.io/pages`):
`cname: meemlang.org`، والشهادة `approved` لـ `meemlang.org` و`www.meemlang.org`، و`https_enforced: true`.

سجلات DNS عند المسجّل (لا تُغيَّر من هنا):

- `meemlang.org`: أربعة `A` إلى `185.199.108.153` و`185.199.109.153` و`185.199.110.153` و`185.199.111.153`.
  (لا `AAAA`؛ إن أُضيفت فإلى `2606:50c0:8000::153` … `2606:50c0:8003::153`.)
- `www.meemlang.org`: `CNAME` إلى `mim-programing-lang.github.io`.

في الموقع: `public/CNAME` و`SITE_URL=https://meemlang.org` (الافتراضي).

فحص بعد كل نشر:

```sh
curl -sI https://meemlang.org/ | head -1
curl -s https://meemlang.org/robots.txt
curl -s https://meemlang.org/sitemap-index.xml | head -3
curl -sI https://mim-programing-lang.github.io/ | grep -i location   # https://meemlang.org/
```

إن فُك الربط (نشر بلا `CNAME` مثلاً): أعد `public/CNAME` وانشر، أو
`gh api -X PUT repos/mim-programing-lang/mim-programing-lang.github.io/pages -f cname=meemlang.org`.

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
   `POST`. بلا ملفات تعريف، فلا `Access-Control-Allow-Credentials`. والأصل الآن `https://meemlang.org`.
4. **أمثلة ما بعد 0.7.0:** إن كان الخادم يشغّل حزمة من فرع التطوير فأضف `PUBLIC_PLAYGROUND_INCLUDE_DEV=1` عند البناء.

**الخادم الوهمي** (`scripts/playground-mock/`) للتطوير والاختبار على الجهاز وحده، ولا يدخل في `dist/` ولا يُنشر.

## بديل: Cloudflare Pages

إن نُقل الموقع إليها لاحقاً: `npx wrangler pages deploy dist --project-name <الاسم>`، وتُقرأ عندها `dist/_headers`
(تخزين طويل للخطوط وملفات `_astro`، ورؤوس الأمان للملعب).
