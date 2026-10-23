// وزن صفحة: كل ما يطلبه المتصفح عند فتحها، بعد الضغط (النصوص تُضغط، الخطوط woff2 مضغوطة أصلاً).
// الاستعمال: npm run weight [-- /مسار/]
import { existsSync } from 'node:fs';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { chromium } from 'playwright';
import { serveDist } from './lib/serve.mjs';

const target = process.argv[2] ?? '/';
const server = await serveDist();
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || (existsSync(chromium.executablePath()) ? undefined : '/bin/chromium') });
try {
  const page = await browser.newPage();
  const rows = [];
  page.on('response', async (res) => {
    const body = await res.body().catch(() => null);
    if (!body) return;
    const type = res.headers()['content-type'] ?? '';
    const text = /text|javascript|json|xml|svg/.test(type);
    rows.push({ url: new URL(res.url()).pathname, raw: body.length, gzip: text ? gzipSync(body).length : body.length, br: text ? brotliCompressSync(body).length : body.length });
  });
  await page.goto(server.url + target, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const kb = (n) => (n / 1000).toFixed(1).padStart(7); // ك.ب عشرية (1000 بايت)، كبقية الموقع
  for (const r of rows.sort((a, b) => b.br - a.br)) console.log(`${kb(r.raw)} ${kb(r.gzip)} ${kb(r.br)}  ${r.url}`);
  const sum = (k) => rows.reduce((t, r) => t + r[k], 0);
  console.log(`${kb(sum('raw'))} ${kb(sum('gzip'))} ${kb(sum('br'))}  المجموع (ك.ب: خام، gzip، brotli) — ${rows.length} طلباً`);
} finally {
  await browser.close();
  await server.close();
}
