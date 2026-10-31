// اختبار اتجاه كتل الشيفرة على صفحات الموقع المبنية، في متصفح حقيقي يرسم الصفحات.
// يُشغَّل داخل حاوية فيها Xvfb (scripts/bidi-test-container.sh)، لا على سطح المكتب.
//
// ما يُفحص، في كل سطر من كل كتلة شيفرة:
//   - القطع (tokens) مرتبة بصرياً في اتجاه السطر: كتل ميم من اليمين، والأوامر والنصوص من اليسار. فلا يتغير
//     ترتيب «[1, 2, 3]» ولا «[1,2,3]» بحسب الفراغات.
//   - داخل القطعة التي فيها أرقام: الأرقام وعلامة الكسر والسالب الملتصق («-5»، «3.14») من اليسار إلى اليمين.
//   - العامل ذو الحرفين («<=»، «!=»، «+=») حرفاه متجاوران وبترتيب اتجاه السطر.
// ويُتحقق أن الحالات الثلاث (عدد سالب، قائمة أعداد، «<=») موجودة فعلاً في الصفحات المفحوصة.
import { readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { serveDist } from './lib/serve.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dist = path.join(root, 'dist');
const pages = [];
const walk = (d) => {
  for (const f of readdirSync(d)) {
    const p = path.join(d, f);
    if (statSync(p).isDirectory()) {
      if (f !== 'pagefind' && f !== '_astro' && f !== 'fonts') walk(p);
    } else if (f === 'index.html') pages.push('/' + path.relative(dist, path.dirname(p)) + (d === dist ? '' : '/'));
  }
};
walk(dist);

const server = await serveDist();
const exe = process.env.CHROMIUM_BIN || chromium.executablePath();
const browser = await chromium.launch({ executablePath: existsSync(exe) ? exe : undefined, headless: !process.env.DISPLAY });
const failures = [];
const seen = { negative: 0, list: 0, compare: 0, lines: 0 };
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  for (const p of pages.map((x) => x.replace(/^\/\//, '/'))) {
    await page.goto(server.url + p, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const r = await page.evaluate(() => {
      const out = { problems: [], negative: 0, list: 0, compare: 0, lines: 0 };
      const rect = (node, i) => {
        const range = document.createRange();
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const b = range.getBoundingClientRect();
        return { left: b.left, right: b.right };
      };
      for (const pre of document.querySelectorAll('.expressive-code pre')) {
        const rtl = pre.getAttribute('data-language') === 'meem';
        for (const code of pre.querySelectorAll('.ec-line .code')) {
          // القطع بترتيبها في النص؛ ما في meem-ltr قطعة واحدة.
          const tokens = [];
          for (const el of code.children) {
            const t = el.textContent ?? '';
            if (!t.trim()) continue;
            const b = el.getBoundingClientRect();
            if (b.width === 0) continue;
            tokens.push({ el, text: t.trim(), left: b.left, right: b.right, top: b.top });
          }
          if (!tokens.length) continue;
          out.lines++;
          const text = code.textContent ?? '';
          if (rtl && /(^|[=(\[,\s])-\d/.test(text)) out.negative++;
          if (rtl && /\[\s*-?\d+\s*,/.test(text)) out.list++;
          if (rtl && /<=|>=/.test(text)) out.compare++;
          // 1) ترتيب القطع في اتجاه السطر (على السطر البصري نفسه فقط، لا عند التفاف السطر).
          for (let i = 1; i < tokens.length; i++) {
            const a = tokens[i - 1];
            const b = tokens[i];
            if (Math.abs(a.top - b.top) > 4) continue;
            const ok = rtl ? b.right <= a.left + 1.5 : b.left >= a.right - 1.5;
            if (!ok) {
              out.problems.push(`ترتيب القطع: «${a.text}» ثم «${b.text}» في السطر «${text.trim()}»`);
              break;
            }
          }
          // 2) الأرقام داخل القطعة من اليسار، و3) حرفا العامل بترتيب اتجاه السطر.
          for (const tk of tokens) {
            const walker = document.createTreeWalker(tk.el, NodeFilter.SHOW_TEXT);
            for (let n = walker.nextNode(); n; n = walker.nextNode()) {
              const s = n.textContent ?? '';
              // «-» سالب ملتصق إلا إن سبقه رقم: «1-9» داخل نص عربي مدى أرقام لا عدد سالب، وعرضه بقاعدة يونيكود للعربية.
              for (const m of s.matchAll(/(?<!\d)-?\d+(?:\.\d+)?/g)) {
                if (m[0].length < 2) continue;
                const xs = [...m[0]].map((_, k) => rect(n, m.index + k));
                for (let k = 1; k < xs.length; k++)
                  if (xs[k].left < xs[k - 1].left - 0.5) {
                    out.problems.push(`عدد مقلوب «${m[0]}» في السطر «${text.trim()}»`);
                    break;
                  }
              }
              for (const m of s.matchAll(/<=|>=|!=|==|\+=|-=|\*=|\/=|%=|<<|>>/g)) {
                const a = rect(n, m.index);
                const b = rect(n, m.index + 1);
                const ok = rtl ? b.right <= a.left + 1.5 : b.left >= a.right - 1.5;
                if (!ok) out.problems.push(`عامل مقلوب «${m[0]}» في السطر «${text.trim()}»`);
              }
            }
          }
        }
      }
      return out;
    });
    for (const k of ['negative', 'list', 'compare', 'lines']) seen[k] += r[k];
    for (const pr of r.problems) failures.push(`${p}: ${pr}`);
  }
} finally {
  await browser.close();
  await server.close();
}
console.log(`[bidi] ${pages.length} صفحة، ${seen.lines} سطر شيفرة. حالات وُجدت: عدد سالب ${seen.negative}، قائمة أعداد ${seen.list}، مقارنة <= أو >= ${seen.compare}.`);
for (const k of ['negative', 'list', 'compare']) if (!seen[k]) failures.push(`لم توجد في الصفحات حالة «${k}» ليُختبر اتجاهها`);
if (failures.length) {
  console.error(`[bidi] فشل (${failures.length}):\n  ${failures.slice(0, 40).join('\n  ')}`);
  process.exit(1);
}
console.log('[bidi] نجح: لا قطع ولا أعداد ولا عوامل مقلوبة.');
