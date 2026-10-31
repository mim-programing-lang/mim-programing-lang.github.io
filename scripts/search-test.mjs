// اختبار البحث (Pagefind) بالعربية على الموقع المبني: يشغّل الفهرس الحقيقي في متصفح ويعدّ النتائج.
// كل سطر زوج: الصيغة المكتوبة في الموقع، ثم صيغة أخرى يكتبها الباحث. الاستعمال: npm run search-test
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';
import { serveDist } from './lib/serve.mjs';

const groups = {
  'كلمات كما هي': [['المؤشرات'], ['القواميس'], ['اطبع'], ['meem'], ['رياضيات']],
  'تشكيل في الاستعلام، والنص بلا تشكيل': [['مؤشر', 'مُؤَشِّر'], ['قائمة', 'قَائِمَة'], ['الدوال', 'الدَّوَال']],
  'النص بتشكيل، والاستعلام بلا تشكيل': [['تُترجم', 'تترجم'], ['يُنتج', 'ينتج'], ['المجمّع', 'المجمع'], ['مولَّد', 'مولد']],
  'الهمزات': [['الأخطاء', 'الاخطاء'], ['الأنواع', 'الانواع'], ['إدارة', 'ادارة'], ['أول', 'اول'], ['اذا', 'إذا']],
  'ال التعريف': [['القاموس', 'قاموس'], ['الهياكل', 'هياكل'], ['الوحدات', 'وحدات'], ['النص', 'نص']],
  'المفرد والجمع': [['قائمة', 'قوائم'], ['دالة', 'دوال'], ['مؤشر', 'مؤشرات']],
  'التاء المربوطة والياء': [['دالة', 'داله'], ['مكتبة', 'مكتبه'], ['على', 'علي']],
};

// صفحات المسار والمراجع الجديدة: كل صيغتين، ويجب أن تكون إحدى الصفحات المتوقعة بين النتائج الثلاث الأولى لكلتيهما.
const expect = [
  [['خطر', 'الخطر'], ['/docs/understand/unsafe/', '/learn/unsafe/']],
  [['ورقة الغش', 'ورقة غش'], ['/docs/cheatsheet/']],
  [['اكس او', 'إكس-أو'], ['/learn/projects/tictactoe/']],
  [['دايكسترا', 'dijkstra'], ['/learn/projects/algorithms/']],
  [['بايثون', 'python'], ['/docs/from/python/']],
  [['zig', 'Zig'], ['/docs/from/zig/']],
  [['مقارنة', 'المقارنة'], ['/docs/understand/compare/']],
  [['تمرين', 'تمارين'], ['/learn/*']], // كل درس فيه تمرين: أي صفحة من قسم التعلّم
  [['مخصص', 'المخصصات'], ['/learn/allocators/', '/docs/understand/memory/', '/docs/memory/']],
  [['حجز', 'الحجز'], ['/docs/stdlib/allocation/', '/docs/understand/memory/']],
  [['تعداد', 'التعداد'], ['/learn/enums/', '/docs/language/enums/']],
  [['csv', 'مبيعات'], ['/learn/projects/sales/']],
];

const server = await serveDist();
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || (existsSync(chromium.executablePath()) ? undefined : '/bin/chromium') });
try {
  const page = await browser.newPage();
  await page.goto(server.url + '/');
  const count = (q) =>
    page.evaluate(async (query) => {
      const pf = await import('/pagefind/pagefind.js');
      await pf.init();
      const r = await pf.search(query);
      const top = [];
      for (const x of r.results.slice(0, 3)) top.push((await x.data()).url);
      return { n: r.results.length, first: top[0] ?? '', top };
    }, q);
  for (const [name, pairs] of Object.entries(groups)) {
    console.log(`\n== ${name}`);
    for (const pair of pairs) {
      const out = [];
      for (const q of pair) {
        const r = await count(q);
        out.push(`«${q}» ${r.n}${r.n ? ` (${r.first})` : ''}`);
      }
      console.log('  ' + out.join('   ←→   '));
    }
  }
  console.log('\n== الصفحات الجديدة (يُشترط ظهورها بين النتائج الثلاث الأولى)');
  let failed = 0;
  for (const [pair, urls] of expect) {
    const out = [];
    let ok = true;
    for (const q of pair) {
      const r = await count(q);
      const hit = r.top.some((u) => urls.some((x) => (x.endsWith('*') ? u.startsWith(x.slice(0, -1)) : u.split('#')[0] === x)));
      ok &&= hit;
      out.push(`«${q}» ${r.n} (${r.first})`);
    }
    if (!ok) failed++;
    console.log(`  ${ok ? '✓' : '✗'} ${out.join('   ←→   ')}`);
  }
  console.log(failed ? `\n[search] ${failed} زوجاً لم تظهر صفحته المتوقعة` : `\n[search] الأزواج الجديدة كلها (${expect.length}) وجدت صفحتها`);
  if (failed) process.exitCode = 1;
} finally {
  await browser.close();
  await server.close();
}
