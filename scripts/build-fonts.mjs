// يبني خطوط الموقع: woff2 محلية، مقتطعة على المحارف المستعملة فقط.
// المصادر (OFL، بلا اسم محجوز) تُنزَّل مرة إلى fonts-src/ من مستودع google/fonts.
// الخرج في public/fonts/ و src/styles/fonts.css، وكلاهما يُودَع في المستودع: البناء العادي لا يحتاج الشبكة.
import { mkdirSync, existsSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import subsetFont from 'subset-font';
import { root } from './lib/meem.mjs';
import { collectChars, isArabic, unicodeRange } from './lib/charset.mjs';

const SRC = 'https://raw.githubusercontent.com/google/fonts/main/ofl';
const fonts = [
  {
    family: 'Noto Sans Arabic', out: 'noto-sans-arabic', dir: 'notosansarabic',
    file: 'NotoSansArabic[wdth,wght].ttf', axes: { wdth: 100, wght: { min: 400, max: 700 } },
    pick: (ch) => isArabic(ch),
  },
  {
    family: 'Noto Sans', out: 'noto-sans', dir: 'notosans',
    file: 'NotoSans[wdth,wght].ttf', axes: { wdth: 100, wght: { min: 400, max: 700 } },
    pick: (ch) => !isArabic(ch),
  },
  {
    // خط الكود: هو خط المحرر نفسه.
    family: 'Cairo', out: 'cairo', dir: 'cairo',
    file: 'Cairo[slnt,wght].ttf', axes: { slnt: 0, wght: { min: 400, max: 700 } },
    pick: () => true,
  },
];

const srcDir = path.join(root, 'fonts-src');
const outDir = path.join(root, 'public/fonts');
mkdirSync(srcDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

async function fetchTo(url, dest) {
  if (existsSync(dest)) return;
  console.log(`تنزيل ${url}`);
  const r = await fetch(url);
  if (!r.ok) throw new Error(`تعذّر تنزيل ${url}: ${r.status}`);
  writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
}

const chars = collectChars(['src/content', 'src/components', 'src/generated', 'src/data', 'examples', 'site.config.mjs'].map((p) => path.join(root, p)));
let css = '/* مولَّد بـ npm run fonts — لا تعدّله باليد. */\n';
const manifest = {};

for (const f of fonts) {
  const ttf = path.join(srcDir, `${f.out}.ttf`);
  const lic = path.join(srcDir, `${f.out}-OFL.txt`);
  await fetchTo(`${SRC}/${f.dir}/${encodeURIComponent(f.file)}`, ttf);
  await fetchTo(`${SRC}/${f.dir}/OFL.txt`, lic);
  copyFileSync(lic, path.join(outDir, `${f.out}-OFL.txt`));

  const wanted = [...chars].filter(f.pick).join('');
  const buf = await subsetFont(readFileSync(ttf), wanted, { targetFormat: 'woff2', variationAxes: f.axes });
  writeFileSync(path.join(outDir, `${f.out}.woff2`), buf);
  // ما في الخط فعلاً من المطلوب (ما ليس فيه يسقط إلى خط النظام).
  const ttfSubset = await subsetFont(readFileSync(ttf), wanted, { targetFormat: 'sfnt', variationAxes: f.axes });
  const covered = await coverage(ttfSubset, wanted);
  manifest[f.out] = covered.join('');
  css += `@font-face {
  font-family: '${f.family}';
  src: url('/fonts/${f.out}.woff2') format('woff2');
  font-weight: 400 700;
  font-style: normal;
  font-display: swap;
  unicode-range: ${unicodeRange(covered)};
}\n`;
  console.log(`${f.family}: ${covered.length} محرفاً، ${(buf.length / 1024).toFixed(1)} ك.ب`);
}

writeFileSync(path.join(root, 'src/styles/fonts.css'), css);
writeFileSync(path.join(root, 'src/styles/fonts.coverage.json'), JSON.stringify(manifest, null, 2) + '\n');

/** يقرأ جدول cmap من الخط المقتطع ليعرف أي المحارف المطلوبة موجود فيه. */
async function coverage(sfnt, wanted) {
  const hb = await import('harfbuzzjs');
  const blob = new hb.Blob(sfnt);
  const face = new hb.Face(blob);
  const have = new Set(face.collectUnicodes());
  return [...wanted].filter((ch) => have.has(ch.codePointAt(0)));
}
