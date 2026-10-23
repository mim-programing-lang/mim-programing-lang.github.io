// توحيد عربي لفهرس البحث. Pagefind يوحّد التشكيل والهمزات والتاء المربوطة، ومجذِّعه العربي يوحّد «ال» في أكثر
// الكلمات لا كلها، ولا يربط جمع التكسير بمفرده. هنا تُولَّد لكل صفحة صيغ إضافية من عنوانها ومن حقل keywords:
//   بلا «ال» ومعها، الجمع السالم (ات، ون/ين)، التاء المربوطة والهاء، الألف المقصورة والياء.
// جموع التكسير (قوائم، دوال، هياكل) لا تُشتق آلياً: تُكتب في keywords في رأس الصفحة.

const strip = (w) => w.replace(/[ً-ْٰـ]/g, '').replace(/[أإآ]/g, 'ا');
const STOP = new Set(['من', 'في', 'على', 'الى', 'عن', 'و', 'او', 'ما', 'كيف', 'بعد', 'مع', 'لا']);

export function variants(word) {
  let base = strip(word);
  if (base.length < 3 || STOP.has(base)) return [];
  const out = new Set([base]);
  if (base.startsWith('ال') && base.length > 4) base = base.slice(2);
  out.add(base);
  out.add('ال' + base);
  if (base.endsWith('ة')) {
    out.add(base.slice(0, -1) + 'ه');
    out.add(base.slice(0, -1) + 'ات');
    out.add('ال' + base.slice(0, -1) + 'ات');
  } else if (base.endsWith('ات') && base.length > 4) {
    out.add(base.slice(0, -2));
    out.add(base.slice(0, -2) + 'ة');
  } else if (/(ون|ين)$/.test(base) && base.length > 4) {
    out.add(base.slice(0, -2));
  } else {
    out.add(base + 'ات');
    out.add(base + 'ون');
    out.add(base + 'ين');
  }
  if (base.endsWith('ى')) out.add(base.slice(0, -1) + 'ي');
  if (base.endsWith('ي')) out.add(base.slice(0, -1) + 'ى');
  return [...out];
}

// أسر المصطلحات: المفرد وجمعه (ومنه جمع التكسير). صفحة يرد في نصها أي صيغة من أسرة تُفهرس بصيغ الأسرة كلها،
// بـ«ال» وبدونها. فالبحث عن «وحدات» يجد كل صفحة فيها «الوحدة» أو «وحدة» أو «الوحدات». القائمة في src/data/search-families.json.
import families from '../data/search-families.json' with { type: 'json' };

const withAl = (w) => [w, 'ال' + w];
const familyForms = families.map((f) => [...new Set(f.map(strip).flatMap(withAl))]);

/** الكلمات العربية في نص، موحَّدة، وبلا حروف العطف والجر الملتصقة بأول الكلمة. */
function wordsOf(text) {
  const out = new Set();
  for (const raw of strip(text).split(/[^\u0621-\u064a]+/)) {
    if (!raw) continue;
    out.add(raw);
    const m = /^[وفبكل](.{3,})$/.exec(raw);
    if (m) out.add(m[1]);
    const n = /^لل(.{2,})$/.exec(raw);
    if (n) out.add('ال' + n[1]);
  }
  return out;
}

/**
 * كلمات الفهرسة لصفحة، في مجموعتين:
 *   primary: من عنوانها وكلماتها المفتاحية (الصفحة عن هذا الموضوع) — تُفهرس بوزن عالٍ.
 *   mentioned: صيغ أسر المصطلحات الواردة في نصها (الصفحة تذكره) — بوزن منخفض، فلا تسبق صفحة الموضوع.
 */
export function searchTerms(title, keywords = [], body = '') {
  const words = [...title.split(/[\s،:()]+/), ...keywords.flatMap((k) => k.split(/\s+/))].filter((w) => /[\u0621-\u064a]/.test(w));
  const primary = new Set(words.flatMap(variants));
  const own = wordsOf(`${title} ${keywords.join(' ')}`);
  const inBody = wordsOf(body);
  const mentioned = new Set();
  for (const forms of familyForms) {
    if (forms.some((f) => own.has(f))) forms.forEach((f) => primary.add(f));
    else if (forms.some((f) => inBody.has(f))) forms.forEach((f) => mentioned.add(f));
  }
  return { primary: [...primary].join(' '), mentioned: [...mentioned].join(' ') };
}
