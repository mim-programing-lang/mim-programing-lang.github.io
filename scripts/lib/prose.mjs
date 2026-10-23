// النثر الذي يقرؤه الزائر من صفحة مبنية: يُحذف منها ما ليس نثراً (الشيفرة، والمخرجات، والسكربتات، ورسائل المجمّع في
// فهرس الأخطاء، والسمات). يستعمله فحص الصياغة (scripts/lib/wording.mjs).

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decode = (s) =>
  s.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e) =>
    e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : ENTITIES[e] ?? m,
  );

/** عناصر لا تُقرأ نثراً: تُحذف بمحتواها. (نمط فتح، اسم الوسم للإغلاق) */
const SKIP = ['script', 'style', 'pre', 'code', 'kbd', 'samp', 'svg', 'template', 'noscript', 'select', 'textarea'];
/** أصناف عناصر نصها ليس نثراً للموقع: مخرجات الأمثلة، ورسائل المجمّع في الفهرس، ونتائج الملعب. */
const SKIP_CLASS = ['meem-output', 'catalog-msg', 'pg-out', 'pg-err', 'expressive-code'];

/** يحذف عنصراً بمحتواه مع مراعاة التداخل في الوسم نفسه. */
function dropElement(html, open, tag, repl = ' ') {
  let out = '';
  let i = 0;
  for (;;) {
    open.lastIndex = i;
    const m = open.exec(html);
    if (!m) return out + html.slice(i);
    out += html.slice(i, m.index) + repl;
    let depth = 1;
    let j = m.index + m[0].length;
    const name = tag ?? m[1];
    const re = new RegExp(`<(/?)${name}\\b[^>]*>`, 'gi');
    re.lastIndex = j;
    let t;
    while (depth && (t = re.exec(html))) depth += t[1] ? -1 : /\/>$/.test(t[0]) ? 0 : 1;
    i = t ? t.index + t[0].length : html.length;
  }
}

/** نثر صفحة HTML: نص عادي، كل كتلة في سطر. */
export function proseOf(html) {
  let h = html.replace(/<head[\s\S]*?<\/head>/i, ' ').replace(/<!--[\s\S]*?-->/g, ' ');
  // شريط التنقل والشريط الجانبي والبحث: مكرَّرة في كل صفحة، وتُفحص من مصادرها (nav.mjs) بالصفحة التي تعرضها.
  for (const cls of SKIP_CLASS) h = dropElement(h, new RegExp(`<(\\w+)\\b[^>]*class="[^"]*\\b${cls}\\b[^"]*"[^>]*>`, 'gi'), null);
  // الشيفرة داخل السطر تُستبدل بعلامة «⟦ش⟧» لتبقى الجملة مقروءة، وما سواها يُحذف.
  for (const tag of SKIP) h = dropElement(h, new RegExp(`<${tag}\\b[^>]*>`, 'gi'), tag, ['code', 'kbd', 'samp'].includes(tag) ? '⟦ش⟧' : ' ');
  return decode(
    h
      .replace(/<\/(a|span|button|label|strong|em|b)>/gi, '$& ')
      .replace(/<(br|\/p|\/li|\/h[1-6]|\/td|\/th|\/dt|\/dd|\/summary|\/figcaption|\/div|\/section|\/aside|\/blockquote)\b[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
  )
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}
