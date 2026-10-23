// Lighthouse على الموقع المبني (الأداء وإمكانية الوصول)، بإعداد الهاتف الافتراضي. التقارير في .lighthouse/.
// الاستعمال: npm run lighthouse [-- /مسار/ ...]
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
import { chromium } from 'playwright';
import { root } from './lib/meem.mjs';
import { serveDist } from './lib/serve.mjs';

const pages = process.argv.slice(2).length ? process.argv.slice(2) : ['/', '/docs/types/', '/learn/loops/'];
const out = path.join(root, '.lighthouse');
mkdirSync(out, { recursive: true });
const chromePath = process.env.CHROMIUM_BIN || (existsSync(chromium.executablePath()) ? chromium.executablePath() : '/bin/chromium');
const server = await serveDist();
const chrome = await launch({ chromePath, chromeFlags: ['--headless=new', '--no-sandbox'] });
let failed = false;
try {
  for (const p of pages) {
    const r = await lighthouse(server.url + p, { port: chrome.port, onlyCategories: ['performance', 'accessibility'], output: 'html' });
    const name = p === '/' ? 'home' : p.replace(/^\/|\/$/g, '').replace(/\//g, '-');
    writeFileSync(path.join(out, `${name}.html`), r.report);
    const perf = Math.round(r.lhr.categories.performance.score * 100);
    const a11y = Math.round(r.lhr.categories.accessibility.score * 100);
    const a = r.lhr.audits;
    const failing = Object.values(a).filter((x) => x.score !== null && x.score < 1 && r.lhr.categories.accessibility.auditRefs.some((ref) => ref.id === x.id)).map((x) => x.id);
    console.log(`${p}  الأداء ${perf}  إمكانية الوصول ${a11y}  | LCP ${a['largest-contentful-paint'].displayValue}  TBT ${a['total-blocking-time'].displayValue}  CLS ${a['cumulative-layout-shift'].displayValue}${failing.length ? `  | وصول: ${failing.join(', ')}` : ''}`);
    if (perf < 95 || a11y < 95) failed = true;
  }
} finally {
  await chrome.kill();
  await server.close();
}
if (failed) process.exitCode = 1;
