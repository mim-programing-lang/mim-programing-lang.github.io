// يولّد صفحات الموقع من الكتاب المرجعي المنسوخ في handbook/ (انظر import-handbook.mjs).
// النص منقول كما هو؛ الذي يتغير: الأمثلة تصير مكوّن HBExample (شيفرتها من الكتاب ومخرجها من البيان)، والروابط
// بين صفحات الكتاب تصير روابط الموقع، والروابط إلى وثائق خارج الكتاب تصير نصاً، والعناوين تبدأ من h2.
// الصفحات المولَّدة تُكتب فوق ما سبق في كل تشغيل؛ لا تُحرَّر باليد.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { root } from './lib/meem.mjs';
import { hbDir, hbSource, parseExamples, assertHandbook } from './lib/handbook.mjs';
import { applyWording } from './lib/wording.mjs';

// عدد ما غيّرته طبقة الصياغة (scripts/lib/wording.json) لكل صياغة.
const wordingStats = {};
const word = (s) => applyWording(s, wordingStats)[0];

const { commit } = hbSource();

// إضافات الموقع على نص الكتاب، بأمر صاحب المشروع (2026-10-18)، ومسجَّلة في docs-gaps.md.
const CORRECTIONS = {
  // حالة الإصدار: الكتاب عند الوسم v0.8.0 (36cff0b) كُتب قبل الإصدار فيقول «0.8.0 في التطوير، لم يصدر». الموقع ينقل
  // تصحيح المجمّع نفسه (2bef573 في 0.8.0-dev) مع حالة النشر بعد رفع الحزمة. مسجَّل في docs-gaps.md.
  'README.md': [
    ['يصف **0.7.0**، وقد صدرت ونُشرت: الوسم `v0.7.0` (الإيداع `c919819`)، والحزمة\n`meem 0.7.0+c919819` ([../release-0.7.0.md](../release-0.7.0.md)). وحقل `version` في البيان يقول لكل مثال إن كان\nيعمل بحزمة الإصدار (`0.7.0`) أم في شجرة التطوير وحدها (`0.8.0`، لم يصدر)؛ وما بعد 0.7.0 موسوم «منذ 0.8.0» في الصفحات.', 'يصف **0.8.0**، وقد صدرت: الوسم `v0.8.0` (الإيداع `36cff0b`)، والحزمة\n`meem 0.8.0+36cff0b` ([../release-0.8.0.md](../release-0.8.0.md)). وحقل `version` في البيان يقول لكل مثال إن كان\nيعمل بحزمة الإصدار (`0.8.0`) أم في شجرة التطوير وحدها. ما أُضيف في 0.8.0 موسوم «منذ 0.8.0» في الصفحات.'],
    ['| 0.8.0 | **في التطوير، لم يصدر**:', '| 0.8.0 | **صدرت**: `master` بالوسم `v0.8.0` (إيداع `36cff0b`)، والحزمة `meem-0.8.0-linux-x86_64.tar.xz` منشورة؛ ومحرر ميم 0.2.0 يعمل بميم 0.8.0، والموقع https://meemlang.org على 0.8.0. وفيها:'],
  ],
  // سطران يضيفهما الموقع إلى المصطلحات بأمر صاحب المشروع.
  'glossary.md': [
    ['| الملعب | playground |', '| LLVM | LLVM | مكتبة ترجمة يولّد بها المجمّع شيفرة الآلة من البرنامج (الخيار `--emit-ir` يحفظ ما يعطيه لها) |\n| IEEE-754 | IEEE-754 | معيار تمثيل الأعداد الكسرية في الحاسوب؛ `كسر` في ميم عشري مضاعف الدقة عليه (64 بتاً) |\n| الملعب | playground |'],
  ],
};
const short = commit.slice(0, 7);
assertHandbook();

// ملف الكتاب ← صفحة الموقع.
export const PAGES = {
  'README.md': { slug: 'docs/handbook', title: 'الكتاب المرجعي', drop: ['لوكيل الموقع'] },
  'language/01-lexicon.md': { slug: 'docs/language/lexicon' },
  'language/02-types.md': { slug: 'docs/language/types', keywords: ['نوع', 'انواع', 'عدد', 'كسر', 'قائمة', 'قوائم', 'قاموس', 'قواميس'] },
  'language/03-expressions.md': { slug: 'docs/language/expressions' },
  'language/04-statements.md': { slug: 'docs/language/statements' },
  'language/05-functions.md': { slug: 'docs/language/functions', keywords: ['دالة', 'دوال', 'معامل', 'معاملات'] },
  'language/06-structs.md': { slug: 'docs/language/structs', keywords: ['هيكل', 'هياكل', 'حقل', 'حقول'] },
  'language/07-modules.md': { slug: 'docs/language/modules', keywords: ['وحدة', 'وحدات', 'استورد'] },
  'language/08-memory.md': { slug: 'docs/memory/reference', keywords: ['ذاكرة', 'ادارة الذاكرة', 'مخصص', 'مخصصات', 'خاتمه'] },
  'language/09-low-level.md': { slug: 'docs/language/low-level', keywords: ['مؤشر', 'مؤشرات', 'شريحة', 'خطر'] },
  'language/10-ffi.md': { slug: 'docs/language/ffi' },
  'language/11-security.md': { slug: 'docs/language/security' },
  'language/12-enums.md': { slug: 'docs/language/enums', keywords: ['تعداد', 'تعدادات', 'عضو'] },
  'language/13-errors.md': { slug: 'docs/language/errors', keywords: ['خطأ', 'اخطاء', 'معالجة الاخطاء', 'جرب', 'والا'] },
  'stdlib/README.md': { slug: 'docs/stdlib' },
  'stdlib/builtins.md': { slug: 'docs/stdlib/builtins', keywords: ['اطبع', 'مدمجة', 'مدمجات', 'دالة', 'دوال'] },
  'stdlib/رياضيات.md': { slug: 'docs/stdlib/math' },
  'stdlib/نظام.md': { slug: 'docs/stdlib/system' },
  'stdlib/ملفات.md': { slug: 'docs/stdlib/files' },
  'stdlib/عشوائي.md': { slug: 'docs/stdlib/random' },
  'stdlib/مسارات.md': { slug: 'docs/stdlib/paths', keywords: ['مسار', 'مسارات', 'ملف', 'مجلد', 'امتداد'] },
  'errors/common.md': { slug: 'docs/errors/common', keywords: ['خطأ', 'اخطاء', 'اصلاح'] },
  'tools/options.md': { slug: 'docs/tools/options' },
  'tools/check-json.md': { slug: 'docs/tools/check-json', schema: true },
  'migration/0.6-to-0.7.md': { slug: 'docs/migration' },
  'migration/0.7-to-0.8.md': { slug: 'docs/migration/to-0-8', description: 'ما تغيّر بين ميم 0.7 و0.8: الصيغ المهجورة صارت أخطاء ترجمة، والرسائل بمعرّفات ثابتة، وصيغ جديدة في النصوص، وما يُضاف ولا يكسر.', keywords: ['ترحيل', 'ترقية', '0.8', 'مهجورة', 'معرف'] },
  'migration/errors.md': { slug: 'docs/migration/errors', keywords: ['ترحيل', 'معالجة الاخطاء', 'جرب', 'والا'] },
  'glossary.md': { slug: 'docs/glossary' },
  // errors/catalog.md يعرضه مكوّن خاص (src/components/ErrorCatalog.astro) في docs/errors/catalog.mdx
  // learn/README.md مادة الدروس في src/content/docs/learn/ (مكتوبة باليد من الكتاب)
};
const EXTRA = { 'errors/catalog.md': '/docs/errors/catalog/', 'learn/README.md': '/learn/', 'tools/check-json.schema.json': '/docs/tools/check-json/#المخطط' };

// عنوان صفحة الكتاب (أول عنوان h1 في ملفها)، ليحلّ محل اسم الملف في نص الرابط.
function titleOf(file) {
  for (const f of [file, `${file}/README.md`]) {
    try {
      const m = /^#\s+(.*)$/m.exec(readFileSync(path.join(hbDir, f), 'utf8'));
      if (m) return m[1].replace(/`/g, '');
    } catch {}
  }
  return null;
}

const urlOf = (file) => (PAGES[file] ? `/${PAGES[file].slug}/` : EXTRA[file] ?? null);

function rewriteLink(label, target, from) {
  const [p, frag] = target.split('#');
  if (/^https?:/.test(p)) return `[${label}](${target})`;
  if (!p) return label; // مرساة داخل الصفحة: عناوين الموقع تختلف، فالنص وحده
  const resolved = path.normalize(path.join(path.dirname(from), p)).replace(/\/$/, '');
  let url = urlOf(resolved) ?? urlOf(`${resolved}/README.md`);
  const DIRS = { language: '/docs/language/lexicon/', stdlib: '/docs/stdlib/', errors: '/docs/errors/common/', tools: '/docs/tools/options/', learn: '/learn/', migration: '/docs/migration/' };
  if (!url && DIRS[resolved]) url = DIRS[resolved];
  if (url) return `[${/\.(md|json)$|^\.\.?\/|\/$/.test(label) ? titleOf(resolved) ?? label : label}](${url})`;
  // خارج الكتاب: وثيقة في مستودع المجمّع لا صفحة في الموقع.
  // الاسم وحده إن كان نص الرابط مساراً (../../enums.md)، لا المسار النسبي.
  const shown = /^[./]*[^\s]*\.(md|json|py)$/.test(label) ? `\`${path.basename(p)}\`` : label;
  return `${shown} <small>(وثيقة في مستودع المجمّع)</small>`;
}

function escapeProse(line) {
  return line
    .split(/(`+[^`]*`+)/)
    .map((part, i) => (i % 2 ? part : part.replace(/([{}<])/g, '\\$1')))
    .join('');
}

function convert(file, meta) {
  let text = readFileSync(path.join(hbDir, file), 'utf8');
  for (const [from, to] of CORRECTIONS[file] ?? []) {
    if (!text.includes(from)) throw new Error(`تصحيح لم يجد نصه في ${file}: ${from}`);
    text = text.split(from).join(to);
  }
  const examples = parseExamples(text);
  const exAt = new Map(examples.map((e) => [e.start, e]));
  const lines = text.split('\n');
  let title = meta.title;
  const out = [];
  let minLevel = 6;
  for (const l of lines) {
    const h = /^(#{2,6})\s/.exec(l);
    if (h) minLevel = Math.min(minLevel, h[1].length);
  }
  const shift = minLevel > 2 ? minLevel - 2 : 0;
  let dropping = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (exAt.has(i)) {
      const e = exAt.get(i);
      out.push(`<HBExample id="${file}#${e.n}" />`);
      i = e.end;
      continue;
    }
    const fence = /^(\s*)```(\S*)\s*$/.exec(line);
    if (fence) {
      const body = [];
      for (i++; i < lines.length && !/^\s*```\s*$/.test(lines[i]); i++) body.push(lines[i]);
      if (dropping) continue;
      let lang = fence[2];
      // كتلة ميم بلا ناتج: للعرض. لا تُفحص بالمجمّع المحلي (0.6): تصف 0.7.
      if (lang === 'ميم') lang = 'ميم nocheck';
      else if (!lang || lang === 'الناتج' || lang === 'خطأ') lang = /[ء-ي]/.test(body.find((l) => l.trim()) ?? '') && !/^\s*\[/.test(body[0] ?? '') ? 'ميم nocheck' : 'text';
      out.push(`${fence[1]}\`\`\`${lang}`, ...body, `${fence[1]}\`\`\``);
      continue;
    }
    const h1 = /^#\s+(.*)$/.exec(line);
    if (h1 && !title) {
      title = word(h1[1]).replace(/`/g, '');
      continue;
    }
    if (h1) continue;
    const h = /^(#{2,6})\s+(.*)$/.exec(line);
    if (h) {
      dropping = (meta.drop ?? []).some((d) => h[2].includes(d));
      if (dropping) continue;
      out.push(`${'#'.repeat(h[1].length - shift)} ${escapeProse(word(h[2]))}`);
      continue;
    }
    if (dropping) continue;
    out.push(escapeProse(word(line)).replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, target) => rewriteLink(label, target, file)));
  }
  return { title, body: out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n' };
}

function description(body) {
  const para = body.split('\n\n').find((p) => p && !/^[|<#:`>-]/.test(p.trim()) && /[ء-ي]/.test(p));
  return (para ?? '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/<[^>]+>/g, '').replace(/[*`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 155).replace(/\s\S*$/, '…');
}

for (const [file, meta] of Object.entries(PAGES)) {
  const { title, body } = convert(file, meta);
  const depth = meta.slug.split('/').length;
  const up = '../'.repeat(depth + 1);
  let schema = '';
  if (meta.schema) {
    const json = readFileSync(path.join(hbDir, 'tools/check-json.schema.json'), 'utf8').trimEnd();
    schema = `\n## المخطط\n\nملف \`tools/check-json.schema.json\` في الكتاب المرجعي، كما هو:\n\n\`\`\`json\n${json}\n\`\`\`\n`;
  }
  const page = `---
title: ${JSON.stringify(title)}
description: ${JSON.stringify(meta.description ?? (description(body) || title))}${meta.keywords ? `\nkeywords: ${JSON.stringify(meta.keywords)}` : ''}
---

import HBExample from '${up}components/HBExample.astro';
import VersionBanner from '${up}components/VersionBanner.astro';
import HBSource from '${up}components/HBSource.astro';

<VersionBanner />

<HBSource file="${file}" />

${body}${schema}`;
  const dest = path.join(root, 'src/content/docs', `${meta.slug}.mdx`);
  mkdirSync(path.dirname(dest), { recursive: true });
  writeFileSync(dest, page);
}
console.log(`[gen-handbook] ${Object.keys(PAGES).length} صفحة من الكتاب المرجعي (${short}).`);
const changed = Object.entries(wordingStats).map(([f, n]) => `«${f}» ×${n}`);
if (changed.length) console.log(`[gen-handbook] طبقة الصياغة: ${changed.join('، ')}`);
