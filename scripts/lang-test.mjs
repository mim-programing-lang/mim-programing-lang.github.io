// اختبار اللغتين على الموقع المبني: التحويل التلقائي إلى /en/ وزر اللغة، والاتجاه في كل صفحة، والجوال، والبحث بكل لغة،
// وسياسة الأمان. يُشغَّل في حاوية Xvfb (npm run test:lang)، لا على سطح المكتب.
import { chromium } from 'playwright';
import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serveDist } from './lib/serve.mjs';

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const server = await serveDist();
const base = server.url;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || (existsSync(chromium.executablePath()) ? undefined : '/bin/chromium') });
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36';
let fails = 0;
const check = (name, ok, extra = '') => { console.log(`${ok ? '✓' : '✗'} ${name}${extra ? ' — ' + extra : ''}`); if (!ok) fails++; };
const ctxFor = (opts) => browser.newContext({ userAgent: UA, ...opts });
const pathOf = (u) => new URL(u).pathname;

// 1) التحويل التلقائي
const cases = [
  ['متصفح إنجليزي (en-US) يُحوَّل', { locale: 'en-US' }, '/learn/print/', '/en/learn/print/'],
  ['متصفح إنجليزي (en-GB) من الرئيسية', { locale: 'en-GB' }, '/', '/en/'],
  ['متصفح عربي (ar) يبقى', { locale: 'ar' }, '/learn/print/', '/learn/print/'],
  ['متصفح فرنسي (fr-FR) يبقى عربياً', { locale: 'fr-FR' }, '/learn/print/', '/learn/print/'],
  ['محرك بحث (Googlebot) بلغة إنجليزية لا يُحوَّل', { locale: 'en-US', userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }, '/learn/print/', '/learn/print/'],
  ['محرك بحث (bingbot) لا يُحوَّل', { locale: 'en-US', userAgent: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)' }, '/docs/', '/docs/'],
];
for (const [name, opts, from, want] of cases) {
  const ctx = await ctxFor(opts);
  const page = await ctx.newPage();
  await page.goto(base + from, { waitUntil: 'load' });
  await page.waitForTimeout(300);
  check(`التحويل: ${name}`, pathOf(page.url()) === want, pathOf(page.url()));
  await ctx.close();
}
// اللغة الأولى عربية والثانية إنجليزية: يبقى عربياً
{
  const ctx = await ctxFor({ locale: 'ar' , extraHTTPHeaders: { 'Accept-Language': 'ar,en;q=0.8' } });
  await ctx.addInitScript(() => Object.defineProperty(navigator, 'languages', { get: () => ['ar', 'en-US'] }));
  const page = await ctx.newPage();
  await page.goto(base + '/start/', { waitUntil: 'load' });
  check('التحويل: لغتان، الأولى عربية، يبقى عربياً', pathOf(page.url()) === '/start/', pathOf(page.url()));
  await ctx.close();
}
// اختيار الزر يتغلب على التحويل، ويبقى بعد إغلاق الصفحة
{
  const ctx = await ctxFor({ locale: 'en-US' });
  const page = await ctx.newPage();
  await page.goto(base + '/learn/loops/', { waitUntil: 'load' });
  check('الزر: بدأ مُحوَّلاً إلى الإنجليزية', pathOf(page.url()) === '/en/learn/loops/', pathOf(page.url()));
  await page.locator('header a.lang-switch:visible').first().click();
  await page.waitForLoadState('load');
  await page.waitForTimeout(300);
  check('الزر: «العربية» ينقل إلى المقابلة العربية ويبقى', pathOf(page.url()) === '/learn/loops/', pathOf(page.url()));
  const stored = await page.evaluate(() => localStorage.getItem('meem-lang'));
  check('الزر: الاختيار محفوظ في localStorage', stored === 'ar', String(stored));
  const p2 = await ctx.newPage();
  await p2.goto(base + '/docs/', { waitUntil: 'load' });
  await p2.waitForTimeout(300);
  check('الزر: زيارة لاحقة بمتصفح إنجليزي تبقى عربية', pathOf(p2.url()) === '/docs/', pathOf(p2.url()));
  await p2.locator('header a.lang-switch:visible').first().click();
  await p2.waitForLoadState('load');
  check('الزر: «English» من العربية ينقل إلى /en/ ويحفظ en', pathOf(p2.url()) === '/en/docs/' && (await p2.evaluate(() => localStorage.getItem('meem-lang'))) === 'en', pathOf(p2.url()));
  await ctx.close();
}
// التخزين غير متاح: لا خطأ، والتحويل يعمل
{
  const ctx = await ctxFor({ locale: 'en-US' });
  await ctx.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } }); });
  const page = await ctx.newPage();
  // سكربت المظهر في Starlight يرمي هنا أيضاً (قائم في الصفحة العربية بلا تحويل)؛ المعدود أخطاء سكربتاتنا وحدها.
  const errs = []; page.on('pageerror', (e) => { if (/lang-redirect|LangButton|LearnPath|search-warm/.test(e.stack ?? '')) errs.push(e.message); });
  await page.goto(base + '/learn/', { waitUntil: 'load' });
  check('التخزين ممنوع: التحويل يعمل بلا خطأ من سكربتاتنا', pathOf(page.url()) === '/en/learn/' && errs.length === 0, `${pathOf(page.url())} ${errs.join(' | ')}`);
  await ctx.close();
}

// 2) الاتجاه في كل الصفحات، و3) الجوال، و5) سياسة الأمان
const pages = [];
const walk = (d, rel) => { for (const f of readdirSync(d)) { const p = d + '/' + f; if (statSync(p).isDirectory()) { if (f !== 'pagefind' && f !== '_astro') walk(p, rel + f + '/'); } else if (f === 'index.html') pages.push('/' + rel); } };
walk(dist, '');
const ctx = await ctxFor({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true, locale: 'ar' });
const page = await ctx.newPage();
const csp = []; page.on('console', (m) => { if (/Content Security Policy|Refused/.test(m.text())) csp.push(`${page.url()}: ${m.text()}`); });
const pageErrs = []; page.on('pageerror', (e) => pageErrs.push(`${page.url()}: ${e.message}`));
const dirBad = [], overflow = [];
let translated = 0, fallback = 0;
for (const p of pages) {
  await page.goto(base + p, { waitUntil: 'load' });
  const r = await page.evaluate(() => {
    const h = document.documentElement, m = document.querySelector('main');
    return { lang: h.lang, dir: h.dir, mlang: m?.getAttribute('lang'), mdir: m?.getAttribute('dir'),
      notice: /not been translated into English/.test(document.body.innerText),
      cs: m ? getComputedStyle(m).direction : '', over: h.scrollWidth - h.clientWidth };
  });
  const en = p.startsWith('/en/');
  const okHtml = en ? r.lang === 'en' && r.dir === 'ltr' : r.lang === 'ar' && r.dir === 'rtl';
  let okMain;
  if (!en) okMain = r.mlang === 'ar' && r.mdir === 'rtl' && r.cs === 'rtl' && !r.notice;
  else if (r.mlang === 'en') { translated++; okMain = r.mdir === 'ltr' && r.cs === 'ltr' && !r.notice; }
  else { fallback++; okMain = r.mlang === 'ar' && r.mdir === 'rtl' && r.cs === 'rtl' && r.notice; }
  if (!okHtml || !okMain) dirBad.push(`${p} ${JSON.stringify(r)}`);
  if (r.over > 1) overflow.push(`${p} (+${r.over}px)`);
}
check(`الاتجاه: ${pages.length} صفحة (العربية rtl، والإنجليزية ltr: ${translated} مترجمة و${fallback} بالعربية مع التنبيه)`, dirBad.length === 0, dirBad.slice(0, 5).join(' | '));
check(`الجوال: ${pages.length} صفحة بعرض 360 بلا تمرير أفقي`, overflow.length === 0, overflow.join('، '));
check('سياسة الأمان: لا مخالفة', csp.length === 0, csp.slice(0, 3).join(' | '));
check('لا أخطاء JavaScript', pageErrs.length === 0, pageErrs.slice(0, 3).join(' | '));
await ctx.close();

// 4) البحث بكل لغة
for (const [from, q, prefix] of [['/en/', 'allocator', '/en/'], ['/en/', 'tic-tac-toe', '/en/'], ['/', 'مخصص', '/'], ['/', 'إكس-أو', '/']]) {
  const c = await ctxFor({ locale: from === '/' ? 'ar' : 'en-US' });
  const pg = await c.newPage();
  await pg.goto(base + from, { waitUntil: 'load' });
  const top = await pg.evaluate(async (query) => {
    const pf = await import('/pagefind/pagefind.js'); await pf.init();
    const r = await pf.search(query); const out = [];
    for (const x of r.results.slice(0, 3)) out.push((await x.data()).url);
    return out;
  }, q);
  const ok = top.length > 0 && top.every((u) => (prefix === '/en/' ? u.startsWith('/en/') : !u.startsWith('/en/')));
  check(`البحث من ${from}: «${q}» نتائجه بلغة الصفحة`, ok, top.join(' '));
  await c.close();
}
await browser.close();
await server.close?.();
console.log(fails ? `[lang] ${fails} إخفاق` : '[lang] نجح كله');
process.exit(fails ? 1 : 0);
