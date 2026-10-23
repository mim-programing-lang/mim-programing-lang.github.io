// يجلب من مستودع المجمّع ما يُنقل منه حرفياً إلى الموقع، من الإيداع الذي بُني منه المجمّع المستعمل (MEEM_BIN)،
// لا من رأس المستودع (قد يكون فيه توثيق ميزات لم تصدر). يقرأ بـ git show ولا يكتب في المستودع.
//
//   - وثائق docs/*.md المذكورة في DOCS: كل واحدة تصير صفحة. كل كتلة ```ميم يتبعها ```الناتج تصير مثالاً في
//     examples/ يشغّله البناء، والمكتوب في الوثيقة يُحفظ مخرجاً منتظراً (.doc-out) يُقارن بما يطبعه المجمّع.
//   - أمثلة الذاكرة examples/memory/: تُنسخ مع مخرجاتها المسجَّلة هناك (stdout و stderr ورمز الخروج).
//
// الاستعمال: COMPILER_REPO=/مسار/المجمع npm run import-docs   (الافتراضي: ../my_compiler)
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { root, meemJson } from './lib/meem.mjs';
import { applyWordingMarkdown } from './lib/wording.mjs';

const repo = path.resolve(process.env.COMPILER_REPO ?? path.join(root, '../my_compiler'));
const v = meemJson(['--version']);
if (!v.commit) fail('المجمّع المستعمل لا يذكر إيداعه (commit)؛ لا أعرف أي نسخة من الوثائق تخصه.');
const commit = v.commit.slice(0, 7);

function fail(m) {
  console.error(`[import-docs] ${m}`);
  process.exit(1);
}
function git(...args) {
  const r = spawnSync('git', ['-C', repo, ...args], { encoding: 'utf8', maxBuffer: 64 << 20 });
  if (r.status !== 0) fail(`git ${args.join(' ')} فشل في ${repo}. اضبط COMPILER_REPO على مستودع المجمّع.\n${r.stderr}`);
  return r.stdout;
}
const show = (file) => git('show', `${v.commit}:${file}`);

// روابط بين وثائق المجمّع ← صفحات الموقع. ما ليس هنا يبقى نصاً بلا رابط.
const LINKS = {
  'strings-and-print.md': '/docs/strings-and-print/', 'semantics.md': '/docs/semantics/', 'stdlib.md': '/docs/stdlib/guide/',
  'build.md': '/docs/build/', 'performance.md': '/docs/performance/', 'memory.md': '/docs/memory/',
  'tools-contract.md': '/docs/tools-contract/', 'cli.md': '/docs/cli/',
};

const DOCS = [
  // منذ الكتاب المرجعي (0.7) صفحات اللغة منه (scripts/gen-handbook-pages.mjs)؛ يبقى هنا ما ليس فيه: الأداء.
  {
    doc: 'performance.md', page: 'docs/performance', dir: null,
    title: 'الأداء',
    description: 'قياس زمن برامج ميم مقابل C و Rust على سبعة برامج، بمنهجه وحدوده، وكلفة الفحوص والعدّ المرجعي، وما لم يُقس.',
    keywords: ['اداء', 'سرعة', 'قياس', 'قياسات', 'زمن', 'مقارنة'],
    // الطبقة المنخفضة تصميم لم يُنفَّذ: لا يُعرض ولا يُحال إليه.
    edit: (s) => s.replace(/ ?\(\[low-level\.md\]\([^)]*\)[^)]*\)/g, '').replace(/\[low-level\.md\]\([^)]*\)/g, ''),
    lead: `:::caution[اقرأ الأرقام بمنهجها]
- الأزمنة **وسيط ثلاث جولات**، و**حمل الجهاز لم يكن صفراً** أثناء القياس (بين 1.37 و1.72 لقياس 0.6.0). الفروق الأصغر من 5% لا يُعتدّ بها.
- **الجداول نسبة إلى C لا زمن مطلق**: الثواني تتغير بحال الجهاز، والنسبة هي ما يُقارن.
- النسب إلى C في قياس 0.6.0 (جدول القسم 0، عمود «مبني»): **فيبوناتشي 2.7×**، **النصوص 2.3×**، **n-body بأسلوب C 1.1×**، n-body 1.8×، القاموس 1.7×، الغربال 1.5×، والحلقة العددية 0.9×.
- المعالج كان أبطأ في قياس 0.6.0 منه في قياس 0.5.2، فالمقارنة بين الإصدارين بالنسبة إلى C لا بالثواني.
- لم يُقس على جهاز هادئ ولا على معالجات أخرى ولا على برامج حقيقية (القسم «ما لم يُقس»).
:::
`,
  },
];

/** يهرّب ما يفسّره MDX في النثر ({ } <)، ويترك الكود كما هو. */
function escapeProse(line) {
  return line
    .split(/(`+[^`]*`+)/)
    .map((part, i) => (i % 2 ? part : part.replace(/([{}<])/g, '\\$1')))
    .join('');
}
const fileName = (heading) => heading.replace(/[`*«»]/g, '').trim().replace(/[^ء-ي0-9A-Za-z]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'مثال';

let total = 0;
for (const d of DOCS) {
  let src = show(`docs/${d.doc}`);
  if (d.edit) src = d.edit(src);
  const lines = src.split('\n');
  const out = [];
  const used = new Map();
  let heading = '';
  let count = 0;
  if (d.dir) {
    // أمثلة الوثيقة يملكها هذا السكربت: تُمسح وتُكتب من جديد (المخرجات المسجَّلة يعيدها examples:record).
    const dir = path.join(root, 'examples', d.dir);
    if (existsSync(dir)) for (const f of spawnSync('ls', [dir], { encoding: 'utf8' }).stdout.split('\n')) if (/\.(م|doc-out|warn-ok)$/.test(f)) rmSync(path.join(dir, f));
    mkdirSync(dir, { recursive: true });
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fence = /^(\s*)```(\S*)\s*$/.exec(line);
    if (!fence) {
      if (i === 0 && line.startsWith('# ')) continue;
      const h = /^#{2,4}\s+(.*)$/.exec(line);
      if (h) heading = h[1];
      out.push(
        escapeProse(line).replace(/\[([^\]]+)\]\(([^)#]*\.md)(#[^)]*)?\)/g, (_, label, file) => (LINKS[file] ? `[${label}](${LINKS[file]})` : label)).replace(/\[([^\]]+)\]\(#[^)]*\)/g, '$1'),
      );
      continue;
    }
    const body = [];
    for (i++; i < lines.length && !/^\s*```\s*$/.test(lines[i]); i++) body.push(lines[i]);
    const lang = fence[2];
    // كتلة ميم يتبعها ناتجها: مثال يُشغَّل.
    let j = i + 1;
    while (j < lines.length && lines[j].trim() === '') j++;
    if (lang === 'ميم' && /^\s*```الناتج\s*$/.test(lines[j] ?? '') && d.dir) {
      const expected = [];
      for (j++; j < lines.length && !/^\s*```\s*$/.test(lines[j]); j++) expected.push(lines[j]);
      i = j;
      let name = d.names?.[count] ?? fileName(heading);
      const n = (used.get(name) ?? 0) + 1;
      used.set(name, n);
      if (n > 1) name += `_${n}`;
      count++;
      const base = path.join(root, 'examples', d.dir, name);
      writeFileSync(`${base}.م`, body.join('\n') + '\n');
      writeFileSync(`${base}.doc-out`, expected.join('\n') + '\n');
      // مثال من وثيقة المجمّع قد يعرض تحذيراً عن قصد: يمر بحارس الصيغ المهجورة لا بترقية كل تحذير.
      writeFileSync(`${base}.warn-ok`, '');
      out.push(`<Example file="${d.dir}/${name}.م" />`);
      continue;
    }
    // كتلة بلا اسم لغة: أمر طرفية أو مخرج يبقى نصاً؛ غيرهما شفرة ميم للعرض (لا تُشغَّل، فلا ناتج لها في الوثيقة).
    const first = (body.find((l) => l.trim()) ?? '').trim();
    const shown = lang === 'ميم' ? 'ميم nocheck' : lang || (/^(\$ |meem |\.\/|\[|MEEM_)/.test(first) || !/[ء-ي]/.test(first) ? 'text' : 'ميم nocheck');
    out.push(`${fence[1]}\`\`\`${shown}`, ...body, `${fence[1]}\`\`\``);
  }
  total += count;
  const head = `---
title: "${d.title}"
description: "${d.description}"
keywords: [${d.keywords.map((k) => `"${k}"`).join(', ')}]
---

import Example from '${'../'.repeat(d.page.split('/').length + 1)}components/Example.astro';
import version from '${'../'.repeat(d.page.split('/').length + 1)}generated/version.json';

:::note[المصدر]
نص هذه الصفحة منقول حرفياً من \`docs/${d.doc}\` في مستودع المجمّع (الإيداع \`${commit}\`).${count ? ` أمثلتها (${count}) تُشغَّل هنا أيضاً عند كل بناء وتُقارن بالمكتوب في الوثيقة، ومخرجاتها تحتها من <bdi dir="ltr">meem {version.build}</bdi>.` : ''}
:::

${d.lead ?? ''}
`;
  const file = path.join(root, 'src/content/docs', `${d.page}.mdx`);
  mkdirSync(path.dirname(file), { recursive: true });
  // طبقة الصياغة (scripts/lib/wording.json) على النثر وحده.
  writeFileSync(file, head + applyWordingMarkdown(out.join('\n').replace(/^\n+/, '')));
  console.log(`[import-docs] ${d.doc} (${commit}) ← ${d.page}، ${count} مثالاً.`);
}

// أمثلة الذاكرة: ملف .out في المستودع فيه stdout ثم «--- stderr ---» ثم stderr ثم «--- exit: N ---».
const memDir = path.join(root, 'examples/docs/memory');
mkdirSync(memDir, { recursive: true });
const files = git('-c', 'core.quotepath=off', 'ls-tree', '--name-only', `${v.commit}`, 'examples/memory/').split('\n').filter((f) => f.endsWith('.م'));
for (const f of files) {
  const name = path.basename(f, '.م');
  const base = path.join(memDir, name);
  writeFileSync(`${base}.م`, show(f));
  const rec = /^([\s\S]*?)--- stderr ---\n([\s\S]*?)--- exit: (\d+) ---\n?$/.exec(show(f.replace(/\.م$/, '.out')));
  if (!rec) fail(`صيغة غير متوقعة في ${f.replace(/\.م$/, '.out')}`);
  writeFileSync(`${base}.doc-out`, rec[1]);
  writeFileSync(`${base}.doc-err`, rec[2]);
  writeFileSync(`${base}.doc-exit`, `${rec[3]}\n`);
  writeFileSync(`${base}.args`, '--debug-mem\n');
  writeFileSync(`${base}.env`, 'MEEM_RC_REPORT=1\n');
  writeFileSync(`${base}.warn-ok`, '');
}
console.log(`[import-docs] examples/memory (${commit}) ← ${files.length} أمثلة ذاكرة. مجموع أمثلة الوثائق: ${total}.`);
