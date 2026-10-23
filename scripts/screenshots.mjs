// لقطات Playwright للموقع المبني: هاتف وسطح مكتب، فاتح وداكن. الخرج في screenshots/.
// الاستعمال: npm run screenshots [-- /مسار/ /مسار2/]
import { mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { root } from './lib/meem.mjs';
import { serveDist } from './lib/serve.mjs';

const DEFAULT_PAGES = ['/', '/docs/tour/', '/try/'];
const pages = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_PAGES;
const viewports = { phone: { width: 390, height: 844, deviceScaleFactor: 2 }, desktop: { width: 1440, height: 900, deviceScaleFactor: 1 } };
const themes = ['light', 'dark'];

const out = path.join(root, 'screenshots');
mkdirSync(out, { recursive: true });
const server = await serveDist();
const exe = process.env.CHROMIUM_BIN || (existsSync(chromium.executablePath()) ? undefined : '/bin/chromium');
const browser = await chromium.launch({ executablePath: exe });
try {
  for (const p of pages) {
    for (const [vname, vp] of Object.entries(viewports)) {
      for (const theme of themes) {
        const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.deviceScaleFactor, colorScheme: theme, locale: 'ar' });
        await ctx.addInitScript((t) => localStorage.setItem('starlight-theme', t), theme);
        const page = await ctx.newPage();
        const res = await page.goto(server.url + p, { waitUntil: 'networkidle' });
        if (!res.ok()) throw new Error(`${p}: ${res.status()}`);
        await page.evaluate(() => document.fonts.ready);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        const name = `${p === '/' ? 'home' : p.replace(/^\/|\/$/g, '').replace(/\//g, '-')}.${vname}.${theme}.png`;
        await page.screenshot({ path: path.join(out, name), fullPage: true });
        console.log(`${name}${overflow > 0 ? `  ⚠ تمرير أفقي ${overflow}px` : ''}`);
        await ctx.close();
      }
    }
  }
} finally {
  await browser.close();
  await server.close();
}
