// اختبارات واجهة الملعب في متصفح حقيقي، داخل حاوية فيها Xvfb (scripts/playground-test-container.sh).
//   PG_MODE=noapi  البناء بلا PUBLIC_PLAYGROUND_API: الحالة «قيد التجهيز» والزر معطّل والأمثلة للقراءة.
//   PG_MODE=api    البناء بـ PUBLIC_PLAYGROUND_API=http://127.0.0.1:8788/run والخادم الوهمي (scripts/playground-mock/).
// كل اختبار على عرضي الجوال والحاسوب.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { serveDist } from './lib/serve.mjs';

const mode = process.env.PG_MODE ?? 'noapi';
const here = path.dirname(new URL(import.meta.url).pathname);
const viewports = { 'جوال': { width: 390, height: 844 }, 'حاسوب': { width: 1280, height: 900 } };
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
};

let mock;
if (mode === 'api') {
  mock = spawn(process.execPath, [path.join(here, 'playground-mock/server.mjs')], { stdio: 'inherit' });
  await new Promise((r) => setTimeout(r, 800));
}
const server = await serveDist();
const exe = process.env.CHROMIUM_BIN;
const browser = await chromium.launch({ executablePath: exe && existsSync(exe) ? exe : undefined, headless: !process.env.DISPLAY });
const mockCount = async () => (await (await fetch('http://127.0.0.1:8788/count')).json()).count;

try {
  for (const [vname, vp] of Object.entries(viewports)) {
    const ctx = await browser.newContext({ viewport: vp, permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await ctx.newPage();
    const violations = [];
    await page.exposeFunction('__cspViolation', (d) => violations.push(d));
    await page.addInitScript(() => document.addEventListener('securitypolicyviolation', (e) => window.__cspViolation?.(`${e.violatedDirective} ${e.blockedURI}`)));
    const open = async (hash = '') => {
      await page.goto(`${server.url}/playground/${hash}`, { waitUntil: 'load' });
      await page.waitForSelector('.cm-content');
    };
    const setCode = async (code) => {
      await page.click('.cm-content');
      await page.keyboard.press('Control+A');
      await page.keyboard.insertText(code);
    };
    const run = async () => {
      await page.waitForFunction(() => !(document.getElementById('pg-run')).disabled, null, { timeout: 8000 });
      await page.click('#pg-run');
      await page.waitForFunction(() => !/قيد التشغيل/.test(document.getElementById('pg-state').textContent ?? ''), null, { timeout: 20000 });
      return {
        state: await page.textContent('#pg-state'),
        out: await page.textContent('#pg-stdout'),
        err: await page.textContent('#pg-stderr'),
        exit: await page.textContent('#pg-exit'),
      };
    };
    const t = (n) => `${n} [${vname}]`;

    // سياسة الأمان: البحث مسموح (الموقع نفسه وWebAssembly)، والاتصال الخارجي بخادم الملعب وحده.
    await open();
    const csp = (await page.getAttribute('meta[http-equiv="Content-Security-Policy"]', 'content')) ?? '';
    const connect = /connect-src ([^;]*)/.exec(csp)?.[1].trim() ?? '';
    check(t('سياسة الأمان: connect-src'), mode === 'api' ? connect === "'self' http://127.0.0.1:8788" : connect === "'self'", connect);
    check(t("سياسة الأمان: script-src فيها 'wasm-unsafe-eval'"), /script-src [^;]*'wasm-unsafe-eval'/.test(csp));
    // البحث يعمل في صفحة الملعب
    await page.click('site-search button[data-open-modal]');
    await page.fill('site-search input', 'اطبع');
    const found = await page.waitForSelector('site-search .pagefind-ui__result', { timeout: 15000 }).then(() => true, () => false);
    check(t('البحث يعمل في صفحة الملعب'), found);
    await page.keyboard.press('Escape');


    if (mode === 'noapi') {
      await open();
      check(t('بلا واجهة: الحالة «قيد التجهيز»'), /قيد التجهيز/.test((await page.textContent('#pg-state')) ?? ''));
      check(t('بلا واجهة: زر «شغّل» معطّل'), await page.isDisabled('#pg-run'));
      const first = await page.$eval('#pg-examples option:nth-child(2)', (o) => o.value);
      await page.selectOption('#pg-examples', first);
      check(t('بلا واجهة: المثال يُحمَّل ومخرجه المتوقع يُعرض'), !(await page.isHidden('#pg-expected')) && ((await page.textContent('.cm-content')) ?? '').length > 0);
      // «جرّب هذا المثال» من صفحة درس
      await page.goto(`${server.url}/learn/print/`, { waitUntil: 'load' });
      const link = await page.$('a[data-try-example]');
      const id = await link?.getAttribute('data-try-example');
      await link?.click();
      await page.waitForSelector('.cm-content');
      const selected = await page.$eval('#pg-examples', (s) => s.value);
      check(t('«جرّب هذا المثال» يفتح الملعب بالمثال محمّلاً'), !!id && selected === id);
      check(t('بلا واجهة: لا مخالفة لسياسة الأمان'), violations.length === 0, violations.join('، '));
    } else {
      await open();
      check(t('مع واجهة: الحالة «جاهز» والزر مفعّل'), /جاهز/.test((await page.textContent('#pg-state')) ?? '') && !(await page.isDisabled('#pg-run')));
      // نجاح: مثال من الكتاب، والخادم الوهمي يرد بمخرجه المتوقع
      const first = await page.$eval('#pg-examples option:nth-child(2)', (o) => o.value);
      await page.selectOption('#pg-examples', first);
      const expected = await page.textContent('#pg-exp-stdout');
      let r = await run();
      check(t('نجاح'), /^انتهى\.$/.test(r.state ?? '') && r.out === expected, r.state ?? '');
      // الزر معطّل أثناء التشغيل وبعده حتى المدة الدنيا
      check(t('الزر معطّل بعد التشغيل حتى المدة الدنيا'), await page.isDisabled('#pg-run'));
      await setCode('# mock:compile\nاذا صواب');
      r = await run();
      check(t('خطأ ترجمة (2)'), r.exit === '2' && /خطأ نحوي/.test(r.err ?? ''), r.state ?? '');
      await setCode('# mock:runtime');
      r = await run();
      check(t('خطأ تشغيل (3)'), r.exit === '3' && r.out === 'قبل\n' && /خطأ تشغيل/.test(r.err ?? ''));
      await setCode('# mock:timeout');
      r = await run();
      check(t('تجاوز الزمن'), /تجاوز الزمن/.test(r.state ?? ''), r.state ?? '');
      await setCode('# mock:truncate');
      r = await run();
      check(t('خرج مقطوع'), /مقطوع/.test(r.state ?? ''), r.state ?? '');
      await setCode('# mock:500');
      r = await run();
      check(t('فشل الخادم (500)'), /غير متاح/.test(r.state ?? ''), r.state ?? '');
      await setCode('# mock:reset');
      r = await run();
      check(t('فشل الشبكة (انقطاع الاتصال)'), /غير متاح/.test(r.state ?? ''), r.state ?? '');
      // XSS
      await setCode('# mock:xss');
      r = await run();
      const xss = await page.evaluate(() => ({
        flag: window.__xss,
        children: document.getElementById('pg-stdout').children.length + document.getElementById('pg-stderr').children.length,
        imgs: document.querySelectorAll('.pg img').length,
      }));
      check(t('XSS: الخرج نص لا وسوم'), xss.flag === undefined && xss.children === 0 && xss.imgs === 0 && /<script>/.test(r.out ?? '') && /<img/.test(r.err ?? ''), JSON.stringify(xss));
      // المدة الدنيا بين تشغيلين: نقرة فورية لا ترسل طلباً
      const before = await mockCount();
      await page.evaluate(() => (document.getElementById('pg-run')).click());
      check(t('لا تشغيل قبل المدة الدنيا'), (await mockCount()) === before);
      // الرابط المشارك: يحمّل الشيفرة ولا يشغّلها
      const shared = 'اطبع("من رابط")\n# مشاركة';
      await setCode(shared);
      await page.click('#pg-share');
      await page.waitForFunction(() => location.hash.startsWith('#code='), null, { timeout: 5000 }).catch(() => {});
      const hash = await page.evaluate(() => location.hash);
      const countBefore = await mockCount();
      const page2 = await ctx.newPage();
      await page2.goto(`${server.url}/playground/${hash}`, { waitUntil: 'load' });
      await page2.waitForSelector('.cm-content');
      await page2.waitForTimeout(1500);
      const text = await page2.evaluate(() => [...document.querySelectorAll('.cm-line')].map((l) => l.textContent).join('\n'));
      check(t('الرابط المشارك: الشيفرة محمّلة'), hash.startsWith('#code=') && text === shared, hash.slice(0, 40));
      check(t('الرابط المشارك: سطر «جاءت من رابط» ظاهر'), !(await page2.isHidden('#pg-from-link')));
      check(t('الرابط المشارك: لا تشغيل تلقائي'), (await mockCount()) === countBefore);
      await page2.close();
      check(t('مع واجهة: لا مخالفة لسياسة الأمان'), violations.length === 0, violations.join('، '));
    }
    await ctx.close();
  }
} finally {
  await browser.close();
  await server.close();
  mock?.kill();
}
const failed = results.filter((r) => !r.ok);
console.log(`[playground] ${mode}: ${results.length - failed.length} من ${results.length} نجح.`);
process.exit(failed.length ? 1 : 0);
