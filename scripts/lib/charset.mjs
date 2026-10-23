// المحارف التي يحتاجها الموقع: أساس ثابت (اللاتينية الأساسية والأبجدية العربية والتشكيل) وما يظهر فعلاً في المحتوى.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => String.fromCodePoint(a + i));

export const BASE = new Set([
  ...range(0x20, 0x7e),
  ...range(0x0621, 0x063a),
  ...range(0x0640, 0x0655),
  ...range(0x0660, 0x0669),
  ...'،؛؟٪٫٬ٰ«»–—…←→×•·©',
  // علامات تنصيص قد يولّدها محوّل Markdown.
  ...[0x2018, 0x2019, 0x201c, 0x201d].map((c) => String.fromCodePoint(c)),
  ' ',
]);

const TEXT = /\.(mdx?|astro|mjs|js|ts|json|css|txt|م|out|err|in|svg)$/;

export function collectChars(paths) {
  const set = new Set(BASE);
  const walk = (p) => {
    const st = statSync(p, { throwIfNoEntry: false });
    if (!st) return;
    if (st.isDirectory()) return readdirSync(p).forEach((f) => walk(path.join(p, f)));
    if (TEXT.test(p)) for (const ch of readFileSync(p, 'utf8')) if (ch >= ' ') set.add(ch);
  };
  paths.forEach(walk);
  return set;
}

export const isArabic = (ch) => {
  const c = ch.codePointAt(0);
  return (c >= 0x0600 && c <= 0x06ff) || (c >= 0x0750 && c <= 0x077f) || (c >= 0xfb50 && c <= 0xfdff) || (c >= 0xfe70 && c <= 0xfeff);
};

/** يحوّل مجموعة محارف إلى قيمة unicode-range مضغوطة. */
export function unicodeRange(chars) {
  const cps = [...chars].map((c) => c.codePointAt(0)).sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < cps.length; ) {
    let j = i;
    while (j + 1 < cps.length && cps[j + 1] === cps[j] + 1) j++;
    const h = (n) => n.toString(16).toUpperCase();
    out.push(i === j ? `U+${h(cps[i])}` : `U+${h(cps[i])}-${h(cps[j])}`);
    i = j + 1;
  }
  return out.join(', ');
}
