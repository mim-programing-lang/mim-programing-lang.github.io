// بعد البناء: فحوص على dist/. أي إخفاق يُفشل «npm run build».
//   1) كل رابط داخلي يصل إلى صفحة موجودة، وكل مرساة (#) إلى عنصر موجود.
//   2) كل صفحة لها عنوان ووصف غير فارغين.
//   3) كل كتلة كود ميم لُوّنت بقواعد ميم (لم تسقط إلى نص عادي).
//   4) كل محرف في نص الصفحات موجود في أحد خطوط الموقع (وإلا: npm run fonts).
//   5) كل مثال من الكتاب المرجعي معروض كما هو: شيفرته تطابق كتلته في الكتاب، ومخرجه ورمز خروجه يطابقان البيان
//      examples/manifest.json. يُقرأ المعروض من الصفحة المبنية نفسها (زر النسخ ونصوص المخرج).
//   6) العناوين متسلسلة: h1 ثم h2 ثم h3 بلا قفز مستوى.
import { readdirSync, readFileSync, statSync, existsSync, writeFileSync, appendFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { root } from './lib/meem.mjs';
import { hbExamples } from './lib/handbook.mjs';
import { proseOf } from './lib/prose.mjs';
import { checkWording } from './lib/wording.mjs';
import { donateUrl, contactEmail } from '../site.config.mjs';

const dist = path.join(root, 'dist');
const walk = (d) =>
  readdirSync(d).flatMap((f) => {
    const p = path.join(d, f);
    return statSync(p).isDirectory() ? (f === 'pagefind' ? [] : walk(p)) : p.endsWith('.html') ? [p] : [];
  });

const decode = (s) => s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d))).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const pages = new Map();
for (const file of walk(dist)) {
  const html = readFileSync(file, 'utf8');
  pages.set(file, { html, ids: new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => decode(m[1]))) });
}

const hb = hbExamples().examples;
const seenHb = new Set();
// 7) سياسة أمان المحتوى لصفحة الملعب: السكربتات من الموقع نفسه أو المضمَّنة بتجزئتها، والاتصال بالموقع نفسه (فهرس البحث)
//    وبعنوان خادم الملعب وحده.
siteCsp();
const rel = (f) => '/' + path.relative(dist, f).replace(/index\.html$/, '');
const errors = [];
const fontCoverage = JSON.parse(readFileSync(path.join(root, 'src/styles/fonts.coverage.json'), 'utf8'));
const covered = new Set(Object.values(fontCoverage).join(''));
const missingChars = new Map();
let links = 0;

for (const [file, { html }] of pages) {
  const page = rel(file);

  // 1) الروابط
  for (const m of html.matchAll(/<a\b[^>]*\shref="([^"]*)"/g)) {
    const href = decode(m[1]);
    if (/^(https?:|mailto:|tel:)/.test(href)) continue;
    links++;
    const [p, frag] = href.split('#');
    let target = file;
    if (p) {
      if (!p.startsWith('/')) {
        errors.push(`${page}: رابط نسبي «${href}» (اكتب المسار من الجذر)`);
        continue;
      }
      const clean = decodeURIComponent(p);
      target = path.join(dist, clean, clean.endsWith('/') ? 'index.html' : '');
      if (!existsSync(target) || statSync(target).isDirectory()) {
        errors.push(`${page}: رابط مكسور «${href}»`);
        continue;
      }
    }
    // في الملعب جزء الرابط حالة (مثال أو شيفرة مشارَكة) لا مرساة.
    const isState = /^(ex|code)=/.test(frag ?? '') && /playground/.test(p ?? '');
    if (frag && !isState && pages.has(target) && !pages.get(target).ids.has(decodeURIComponent(frag))) {
      errors.push(`${page}: مرساة غير موجودة «${href}»`);
    }
  }

  // 5) أمثلة الكتاب المرجعي
  for (const m of html.matchAll(/<section[^>]*data-hb-example="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g)) {
    const id = decode(m[1]);
    const ex = hb[id];
    seenHb.add(id);
    if (!ex) {
      errors.push(`${page}: مثال «${id}» ليس في البيان`);
      continue;
    }
    const block = m[2];
    const code = decode(/data-code="([^"]*)"/.exec(block)?.[1] ?? '').replace(/\x7f/g, '\n');
    if (code !== ex.code) errors.push(`${page}: شيفرة المثال «${id}» لا تطابق الكتاب المرجعي`);
    const stream = (name) => {
      const pre = new RegExp(`<pre[^>]*data-stream="${name}"[^>]*>([\\s\\S]*?)</pre>`).exec(block);
      if (!pre) return '';
      return [...pre[1].matchAll(/<span class="line">([\s\S]*?)<\/span>/g)].map((l) => decode(l[1]).replace(/\u200b/g, '')).join('\n') + '\n';
    };
    if (stream('stdout') !== (ex.stdout || '')) errors.push(`${page}: مخرج المثال «${id}» لا يطابق البيان`);
    if (stream('stderr') !== (ex.stderr || '')) errors.push(`${page}: مخرج الخطأ للمثال «${id}» لا يطابق البيان`);
    const exit = Number(/data-exit="(\d+)"/.exec(block)?.[1] ?? 0);
    if (exit !== ex.exit) errors.push(`${page}: رمز خروج المثال «${id}» ${exit}، والبيان ${ex.exit}`);
  }

  // 6) تسلسل العناوين داخل المحتوى
  const main = /<main[\s\S]*?<\/main>/.exec(html)?.[0] ?? '';
  let last = 0;
  for (const h of main.matchAll(/<h([1-6])[\s>]/g)) {
    const lvl = Number(h[1]);
    if (last && lvl > last + 1) {
      errors.push(`${page}: قفز في العناوين من h${last} إلى h${lvl}`);
      break;
    }
    last = lvl;
  }

  // 2) العنوان والوصف
  const title = /<title>([^<]*)<\/title>/.exec(html)?.[1].trim();
  const desc = /<meta name="description" content="([^"]*)"/.exec(html)?.[1].trim();
  if (!title) errors.push(`${page}: بلا عنوان`);
  if (!desc) errors.push(`${page}: بلا وصف`);

  // 3) تلوين ميم: القطعة الملوَّنة تحمل متغيرَي لون مختلفين عن لون النص العادي.
  for (const m of html.matchAll(/<pre data-language="(meem|ميم|م)">([\s\S]*?)<\/pre>/g)) {
    if (m[1] !== 'meem') errors.push(`${page}: كتلة كود باسم لغة «${m[1]}» لم تُوحَّد إلى meem`);
    const colors = new Set([...m[2].matchAll(/style="--0:(#[0-9A-Fa-f]+)/g)].map((c) => c[1]));
    const text = m[2].replace(/<[^>]+>/g, '');
    if (colors.size < 2 && /[^\s\d]/.test(text) && text.trim().split('\n').length > 1) {
      errors.push(`${page}: كتلة كود ميم بلا تلوين (هل سقطت قواعد اللغة؟)`);
    }
  }

  // 4) تغطية الخطوط
  const body = html.replace(/<(script|style|svg)[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ');
  for (const ch of decode(body)) {
    if (ch <= ' ' || covered.has(ch) || invisible(ch.codePointAt(0))) continue;
    if (!missingChars.has(ch)) missingChars.set(ch, page);
  }
}

// محارف يُقبل سقوطها إلى خط النظام: أسهم ورموز ليست في الخطوط المصدر أصلاً.
// علامات اتجاه ومحارف بلا عرض.
function invisible(c) {
  return c === 0x7f || (c >= 0x200b && c <= 0x200f) || (c >= 0x2028 && c <= 0x202e) || (c >= 0x2066 && c <= 0x2069) || c === 0xfeff;
}

const tolerated = new Set('←→↑↓⚠✗✓×');
const reallyMissing = [...missingChars].filter(([ch]) => !tolerated.has(ch));
if (reallyMissing.length) {
  errors.push(
    `محارف ليست في خطوط الموقع (شغّل: npm run fonts): ${reallyMissing.map(([ch, p]) => `«${ch}» U+${ch.codePointAt(0).toString(16).toUpperCase()} في ${p}`).join('، ')}`,
  );
}

// 8ب) معرّفات الرسائل الثابتة (منذ 0.8.0): مرساة لكل رسالة في الفهرس باسم معرّفها، وكل مثال خطأ يطبع معرّف رسالته (إلا
//     رسالة يكتبها البرنامج نفسه بـ«خطا_قاتل»)، ولا أثر للمعرّفات المؤقتة القديمة (M41D733) في المراسي والروابط.
{
  const hbData = JSON.parse(readFileSync(path.join(root, 'src/generated/handbook.json'), 'utf8'));
  const stable = hbData.catalog.filter((c) => /^E\d{4}$/.test(c.id));
  if (stable.length) {
    const cat = pages.get(path.join(dist, 'docs/errors/catalog/index.html'));
    const missing = stable.filter((c) => !cat?.ids.has(c.id));
    if (missing.length) errors.push(`/docs/errors/catalog/: ${missing.length} رسالة بلا مرساة بمعرّفها (أولها ${missing[0].id})`);
    for (const ex of Object.values(hbData.examples)) {
      if (ex.code == null) continue;
      for (const tag of `${ex.stderr}${ex.stdout}`.match(/\[(?:خطأ|تحذير)[^\]\n]*\]/g) ?? []) {
        if (!/ E\d{4}\]$/.test(tag) && !/خطا_قاتل/.test(ex.code)) errors.push(`${ex.id}: وسم رسالة بلا معرّف ثابت «${tag}»`);
      }
    }
    for (const [file, { html }] of pages) {
      const old = html.match(/(?:\bid="|href="[^"]*#)[mM][0-9a-fA-F]{6}"|<code dir="ltr">M[0-9A-F]{6}<\/code>/);
      if (old) errors.push(`${rel(file)}: معرّف رسالة مؤقت قديم «${old[0]}»`);
    }
    console.log(`[postbuild] معرّفات الرسائل: ${stable.length} رسالة بمرساة ثابتة، ولا معرّف مؤقت قديم.`);
  }
}

// 9) الصياغة: صيغ محظورة في نثر الصفحات (scripts/lib/wording.json)، بلا شيفرة ولا مخرجات.
let wordingChecked = 0;
for (const [file, { html }] of pages) {
  for (const { use, text } of checkWording(proseOf(html))) errors.push(`${rel(file)}: صياغة محظورة (استعمل: ${use}): «${text}»`);
  wordingChecked++;
}
console.log(`[postbuild] الصياغة: ${wordingChecked} صفحة فُحص نثرها بـ wording.json.`);
// 10) الخصوصية وPayPal: لا بريد ولا اسم شخصي (تجزئات scripts/lib/private-tokens.json) في الصفحات وأصولنا، ولا مورد من
//     PayPal (سكربت أو صورة أو إطار أو نموذج). رابط التبرع وحده، في /support/، ومضبوط كما يجب؛ وبلا المتغير لا رابط PayPal.
{
  const privateHashes = new Set(JSON.parse(readFileSync(path.join(root, 'scripts/lib/private-tokens.json'), 'utf8')).sha256);
  const sha = (t) => createHash('sha256').update(t.normalize('NFC').toLowerCase()).digest('hex');
  const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;
  // الصفحات: لا بريد أياً كان. الأصول (_astro): فيها مكتبات من غيرنا تذكر بُرد مترجميها (Pagefind)، فيُفحص فيها الاسم
  // والمسار وحدهما؛ وأجزاء أي بريد كلمات تمرّ بفحص التجزئة.
  const scan = (where, text, emails = true) => {
    // بريد المشروع العام (site.config.mjs) وحده مسموح؛ أي بريد غيره يفشل البناء.
    if (emails) for (const m of text.match(EMAIL) ?? []) if (m !== contactEmail) errors.push(`${where}: بريد في المبني «${m}»`);
    // كلمات بحسب الخط (عربي أو لاتيني) لا بالمسافة وحدها، فـ«وفلان» و«فلان-آخر» تُفحصان؛ وللعربية بلا سوابق (و ب ل ف ك ال).
    const words = new Set();
    for (const w of text.match(/[\p{Script=Arabic}\p{N}]+|[\p{Script=Latin}\p{N}_-]+/gu) ?? []) {
      for (const p of [w, ...w.split(/[-_]+/)]) {
        words.add(p);
        if (/\p{Script=Arabic}/u.test(p)) for (let q = p; /^[وفبلك]/.test(q) || q.startsWith('ال'); ) words.add((q = q.startsWith('ال') ? q.slice(2) : q.slice(1)));
      }
    }
    for (const w of words) if (w && privateHashes.has(sha(w))) errors.push(`${where}: اسم أو حساب شخصي (تطابق تجزئة في private-tokens.json)`);
    if (/\/home\/[a-z]/.test(text)) errors.push(`${where}: مسار من جهاز البناء (/home/…)`);
  };
  const assets = readdirSync(path.join(dist, '_astro')).filter((f) => /\.(js|css)$/.test(f));
  for (const f of assets) scan(`/_astro/${f}`, readFileSync(path.join(dist, '_astro', f), 'utf8'), false);
  let donateLinks = 0;
  for (const [file, { html }] of pages) {
    const page = rel(file);
    scan(page, html);
    for (const m of html.matchAll(/<(\w+)\b[^>]*\b(?:src|href|action|data|srcset|poster|formaction)="([^"]*paypal[^"]*)"[^>]*>/gi)) {
      if (m[1].toLowerCase() !== 'a') errors.push(`${page}: مورد من PayPal في <${m[1]}> (المسموح رابط <a> وحده)`);
    }
    for (const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) if (/paypal/i.test(m[1])) errors.push(`${page}: سكربت يذكر PayPal`);
    if (/http-equiv="Content-Security-Policy" content="[^"]*paypal/i.test(html)) errors.push(`${page}: سياسة الأمان تذكر PayPal`);
    for (const m of html.matchAll(/<a\b[^>]*href="([^"]*paypal[^"]*)"[^>]*>/gi)) {
      donateLinks++;
      const ok = donateUrl && page === '/support/' && decode(m[1]) === donateUrl && /\btarget="_blank"/.test(m[0]) && /\brel="noopener noreferrer"/.test(m[0]);
      if (!ok) errors.push(`${page}: رابط PayPal غير متوقع «${m[0].slice(0, 120)}»`);
    }
  }
  const support = pages.get(path.join(dist, 'support/index.html'))?.html ?? '';
  if (!support) errors.push('/support/: الصفحة غائبة');
  else if (donateUrl) {
    if (donateLinks !== 1 || !support.includes('data-donate="ready"')) errors.push(`/support/: رابط التبرع يجب أن يظهر مرة واحدة (وُجد ${donateLinks})`);
  } else if (donateLinks || !/data-donate="soon"/.test(support) || !/<button[^>]*donate-button[^>]*disabled/.test(support) || !support.includes('قريباً')) {
    errors.push('/support/: بلا PUBLIC_PAYPAL_DONATE_URL يجب «قريباً» وزر معطّل وبلا رابط PayPal');
  }
  console.log(`[postbuild] الخصوصية: ${pages.size} صفحة و${assets.length} أصلاً بلا اسم شخصي، والصفحات بلا بريد غير بريد المشروع؛ PayPal: ${donateUrl ? `رابط واحد في /support/` : 'بلا رابط («قريباً»)'}، ولا مورد منه.`);
}
console.log(`[postbuild] أمثلة الكتاب المرجعي المعروضة: ${seenHb.size} من ${Object.values(hb).filter((e) => e.code != null).length}`);
if (errors.length) {
  console.error(`\n[فشل البناء] فحوص الموقع المبني (${errors.length}):\n\n${errors.map((e) => `  ✗ ${e}`).join('\n')}\n`);
  process.exit(1);
}
console.log(`[postbuild] ${pages.size} صفحة: ${links} رابطاً داخلياً سليماً، ولكل صفحة عنوان ووصف، وكتل ميم ملوَّنة، والخطوط تغطي النص.`);

// سياسة الأمان لكل صفحة في وسم meta أول الرأس: GitHub Pages لا يضيف رؤوس HTTP. ما لا يقبله وسم meta
// (frame-ancestors وX-Content-Type-Options وReferrer-Policy) لا يُفرض هناك؛ انظر DEPLOY.md.
function siteCsp() {
  const api = (process.env.PUBLIC_PLAYGROUND_API ?? '').trim();
  const origin = /^https?:\/\//.test(api) ? new URL(api).origin : null;
  let count = 0;
  for (const file of walk(dist)) {
    let html = readFileSync(file, 'utf8');
    const playground = html.includes('__PLAYGROUND_CSP__');
    if (!playground && html.includes('http-equiv="Content-Security-Policy"')) continue; // تشغيل سابق على البناء نفسه
    const hashes = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]
      .filter((m) => m[1].trim())
      .map((m) => `'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`);
    const policy = [
      "default-src 'none'",
      // 'wasm-unsafe-eval' لفهرس البحث (Pagefind يعمل بـ WebAssembly)، بقرار صاحب المشروع.
      `script-src 'self' 'wasm-unsafe-eval' ${[...new Set(hashes)].join(' ')}`.trim(),
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      // 'self' لملفات فهرس البحث على الموقع نفسه (ثابت لا يستقبل بيانات)، وفي الملعب أصل خادمه وحده.
      `connect-src 'self'${playground && origin ? ` ${origin}` : ''}`,
      "base-uri 'none'",
      "form-action 'none'",
      "object-src 'none'",
    ].join('; ');
    if (playground) {
      html = html.replace('__PLAYGROUND_CSP__', policy);
      // ترويسة لاستضافة تقرأ _headers (Cloudflare Pages): السياسة نفسها، ومعها ما لا تقبله وسوم meta.
      appendFileSync(path.join(dist, '_headers'), `\n/playground/*\n  Content-Security-Policy: ${policy}; frame-ancestors 'none'\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n`);
      console.log(`[postbuild] الملعب: ${origin ? `يتصل بـ ${origin}` : 'بلا خادم (قيد التجهيز)'}؛ سياسة الأمان بـ ${hashes.length} تجزئة لسكربت مضمَّن.`);
    } else {
      const at = html.search(/<meta charset="utf-8"\s*\/?>/i);
      if (at < 0) throw new Error(`صفحة بلا <meta charset>: ${path.relative(dist, file)}`);
      const close = html.indexOf('>', at) + 1;
      html = `${html.slice(0, close)}<meta http-equiv="Content-Security-Policy" content="${policy}">${html.slice(close)}`;
    }
    writeFileSync(file, html);
    count++;
  }
  console.log(`[postbuild] سياسة الأمان في وسم meta: ${count} صفحة.`);
}
