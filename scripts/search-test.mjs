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
      const first = r.results[0] ? (await r.results[0].data()).url : '';
      return { n: r.results.length, first };
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
} finally {
  await browser.close();
  await server.close();
}
