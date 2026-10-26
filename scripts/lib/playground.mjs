// أمثلة الملعب: ما يصلح أن يُعرض فيه من أمثلة الكتاب المرجعي، بتصفية آلية بالكلمات والوسوم.
//
// حدود الخادم (docs/playground.md في مستودع المجمّع): خيارات --no-unsafe --no-ffi --debug-mem، ولا وحدات إلا رياضيات
// وعشوائي، وبرنامج من ملف واحد، ولا ملفات ولا وسائط ولا متغيرات بيئة. والملعب هنا بلا مدخل (لا مربع إدخال).
// فيُستبعد كل مثال يستعمل ما لا يُتاح، ويُسجَّل سببه.

export const ALLOWED_MODULES = new Set(['رياضيات', 'عشوائي']);
// كلمات تكفي وحدها للاستبعاد، وسببها.
const WORDS = [
  ['خطر', 'الطبقة المنخفضة (خطر) ممنوعة بـ --no-unsafe'],
  ['بلا_فحص', 'الطبقة المنخفضة (بلا_فحص) ممنوعة بـ --no-unsafe'],
  ['خارجي', 'استدعاء C (خارجي) ممنوع بـ --no-ffi'],
  ['اقرأ', 'يقرأ إدخالاً، والملعب بلا إدخال'],
  ['اقرا', 'يقرأ إدخالاً، والملعب بلا إدخال'],
  ['انتهى_الدخل', 'يقرأ إدخالاً، والملعب بلا إدخال'],
];
const TAGS = new Map([
  ['خطر', 'موسوم «خطر»'],
  ['خارجي', 'موسوم «خارجي»'],
  ['هيكل_سي', 'موسوم «هيكل_سي» (استدعاء C)'],
]);

const STOP = '\\s!"#$%&\'()*+,\\-./:;<=>?@\\[\\\\\\]^{|}~،؛؟';
const word = (w) => new RegExp(`(^|[${STOP}])${w}(?=$|[${STOP}])`);

/** يرجع أسباب استبعاد المثال (قائمة فارغة: يصلح للملعب). */
export function exclusionReasons(ex, { includeDev = false, release } = {}) {
  const reasons = [];
  if (ex.code == null) return ['شيفرته ليست في الكتاب المرجعي (من examples/ في المستودع)'];
  // الكود بلا تعليقات ولا نصوص، كي لا تُحسب كلمة في نص أو تعليق.
  const bare = ex.code.replace(/"(?:\\.|[^"\\])*"/g, '""').replace(/'(?:\\.|[^'\\])*'/g, "''").replace(/#.*$/gm, '');
  for (const m of bare.matchAll(/^\s*استورد\s+(\S+)/gm)) {
    const target = m[1];
    if (target.startsWith('"')) reasons.push('يستورد ملفاً، والملعب برنامج من ملف واحد');
    else if (!ALLOWED_MODULES.has(target)) {
      const why = { ملفات: 'يستعمل الملفات', نظام: 'يستعمل نظام (وسائط أو بيئة أو وقت أو إنهاء)' }[target] ?? 'وحدة غير متاحة';
      reasons.push(`${why}: الوحدة «${target}» غير متاحة في الملعب`);
    }
  }
  for (const [w, why] of WORDS) if (word(w).test(bare)) reasons.push(why);
  for (const t of ex.tags ?? []) if (TAGS.has(t)) reasons.push(TAGS.get(t));
  const extra = (ex.flags ?? []).filter((f) => f !== '--deny-deprecated');
  if (extra.length) reasons.push(`سُجّل مخرجه بخيارات (${extra.join(' ')}) غير خيارات الملعب`);
  if (!includeDev && ex.version !== release) reasons.push(`بعد ${release} (فرع التطوير)، والخادم يشغّل حزمة ${release}`);
  return [...new Set(reasons)];
}
