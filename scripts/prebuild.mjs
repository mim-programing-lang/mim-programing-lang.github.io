// قبل البناء: يسأل المجمّع عن اللغة ويولّد منها المراجع وقواعد التلوين، ويتحقق من الأمثلة.
import { mkdirSync, writeFileSync, mkdtempSync, rmSync, existsSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { meem, meemJson, root, MEEM_BIN, BuildError } from './lib/meem.mjs';
import { buildGrammar } from './lib/grammar.mjs';
import { runExamples } from './lib/examples.mjs';
import { checkFences } from './lib/fences.mjs';
import { assertHandbook, hbSource, hbDir, parseExamples } from './lib/handbook.mjs';
import { exclusionReasons } from './lib/playground.mjs';
import { readFileSync } from 'node:fs';

const record = process.argv.includes('--record');
const outDir = path.join(root, 'src/generated');
const write = (name, data) => writeFileSync(path.join(outDir, name), JSON.stringify(data, null, 2) + '\n');

const requiredFiles = [
  'meem.tmLanguage.json',
  'language.json',
  'types.json',
  'modules.json',
  'deprecated.json',
  'options.json',
  'version.json',
  'examples.json',
  'handbook.json',
  'playground.json',
  'help.txt',
];

function ensureFavicon() {
  const logo = path.join(root, 'brand/language-logo.svg');
  const favicon = path.join(root, 'public/favicon.svg');
  if (existsSync(logo)) {
    copyFileSync(logo, favicon);
  } else if (!existsSync(favicon)) {
    writeFileSync(
      favicon,
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#D8271C"/></svg>\n',
    );
  }
}

const hasGenerated = requiredFiles.every((f) => existsSync(path.join(outDir, f)));

let compilerAvailable = false;
try {
  const check = meem(['--version']);
  if (check.status === 0) compilerAvailable = true;
} catch {
  compilerAvailable = false;
}

if (!compilerAvailable && (process.env.SKIP_PREBUILD === '1' || process.env.CI || hasGenerated)) {
  if (hasGenerated) {
    console.log(`[meem] لم يتم العثور على المجمّع («${MEEM_BIN}»)، سيتم استخدام الملفات المولدة مسبقاً في src/generated.`);
    ensureFavicon();
    process.exit(0);
  }
}

try {
  mkdirSync(outDir, { recursive: true });

  const version = meemJson(['--version']);
  console.log(`[meem] ${MEEM_BIN} ← ${version.build ?? version.version}`);

  const language = meemJson(['--list-keywords']);
  const types = meemJson(['--list-types']);

  // من مجلد فارغ، حتى لا يظهر إلا ما يأتي مع المجمّع.
  const empty = mkdtempSync(path.join(tmpdir(), 'meem-site-'));
  let modules;
  try {
    const listing = meemJson(['--list-modules'], { cwd: empty });
    modules = listing.modules
      .filter((m) => m.origin === 'standard' && !m.shadowed)
      .map((m) => {
        const d = meemJson(['--list-module', m.name], { cwd: empty });
        // بلا مسارات هذا الجهاز.
        return { name: d.module, functions: d.functions, structs: d.structs, constants: d.constants };
      });
  } finally {
    rmSync(empty, { recursive: true, force: true });
  }

  // سجل الصيغ المهجورة: أُضيف للمجمّع بعد 0.4.0+52dbaba. null إن كان المجمّع المستعمل لا يعرفه.
  const dep = meem(['--list-deprecated', '--json']);
  write('deprecated.json', dep.status === 0 ? JSON.parse(dep.stdout) : null);

  const options = meem(['--list-options', '--json']);
  write('options.json', options.status === 0 ? JSON.parse(options.stdout) : null);

  write('version.json', { version: version.version, build: version.build ?? version.version, contract: version.contract });
  write('language.json', language);
  write('types.json', types);
  write('modules.json', modules);
  // التلوين يصف ما في الصفحات، وأمثلتها من الكتاب المرجعي (0.7): تُضاف كلمات الكتاب وأنواعه ومعاملاته ومدمجاته
  // إلى ما يعرفه المجمّع المحلي، فتُلوَّن «خاتمه» و«خطر» ونحوهما.
  const highlightLang = mergeHandbookLexicon(language);
  write('meem.tmLanguage.json', buildGrammar(highlightLang));

  const grammar = buildGrammar(highlightLang);
  const { examples, libraries, expectedErrors, unguarded, frozen, guard } = runExamples({ record, language });
  write('examples.json', examples);
  const fences = checkFences({ names: [grammar.name, ...grammar.aliases], guard, language });

  // الكتاب المرجعي: أمثلته (الشيفرة من الكتاب والمخرج من البيان) وفهرس رسائله.
  const hb = assertHandbook();
  const catalogText = readFileSync(path.join(hbDir, 'errors/catalog.md'), 'utf8');
  const catalog = parseCatalog(catalogText, hb.examples);
  const catalogTop = parseCatalogTop(catalogText);
  // إصدار الموقع: البيان قد يُكتب قبل الإصدار (عند الوسم v0.8.0 يقول release 0.7.0 وdevelopment 0.8.0). إن كان المجمّع الذي
  // يبني الموقع هو إصدار التطوير نفسه فقد صدر، وأمثلته ليست «بعد الإصدار».
  const release = hb.development && version.version === hb.development ? hb.development : hb.release;
  write('handbook.json', { source: hbSource(), release, development: hb.development, examples: hb.examples, catalog, catalogTop });

  // أمثلة الملعب: الآمنة وحدها. PUBLIC_PLAYGROUND_INCLUDE_DEV=1 يُدخل أمثلة ما بعد الإصدار إن كان الخادم يشغّل حزمة منها.
  const includeDev = process.env.PUBLIC_PLAYGROUND_INCLUDE_DEV === '1';
  const pgAllowed = [];
  const pgExcluded = [];
  for (const ex of Object.values(hb.examples)) {
    const reasons = exclusionReasons(ex, { includeDev, release });
    if (reasons.length) pgExcluded.push({ id: ex.id, title: ex.title, reasons });
    else pgAllowed.push({ id: ex.id, title: ex.title, topic: ex.topic, code: ex.code, stdout: ex.stdout, stderr: ex.stderr, exit: ex.exit, version: ex.version });
  }
  // كلمات التلوين في محرر الملعب، من وصف اللغة نفسه الذي يلوّن كتل الشيفرة.
  const words = {
    keywords: [...new Set([...highlightLang.keywords.flatMap((k) => [k.word, ...k.aliases]), ...highlightLang.compound_keywords.flatMap((k) => k.words.split(/\s+/))])],
    types: [...new Set([...highlightLang.types.map((t) => t.word), ...highlightLang.extern_types.map((t) => t.word)])],
    builtins: [...new Set(highlightLang.builtins.flatMap((b) => [b.name, ...(b.aliases ?? [])]))],
    constants: highlightLang.constants.map((c) => c.word),
  };
  write('playground.json', { includeDev, words, examples: pgAllowed, excluded: pgExcluded.map(({ id, reasons }) => ({ id, reasons })) });
  writePlaygroundExclusions(pgAllowed, pgExcluded, includeDev, release);

  const help = meem(['--help']);
  writeFileSync(path.join(outDir, 'help.txt'), help.stdout);

  // أيقونة الموقع من شعار اللغة؛ وما دام غائباً فمربع بلون الهوية بلا رسم.
  const logo = path.join(root, 'brand/language-logo.svg');
  const favicon = path.join(root, 'public/favicon.svg');
  if (existsSync(logo)) copyFileSync(logo, favicon);
  else
    writeFileSync(
      favicon,
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#D8271C"/></svg>\n',
    );

  const brand = ['language-logo.svg', 'editor-logo.svg'].filter((f) => !existsSync(path.join(root, 'brand', f)));
  if (brand.length) console.warn(`[تنبيه] شعار غائب في brand/: ${brand.join('، ')} — يُعرض الاسم نصاً مكانه.`);

  console.log(
    `[meem] ${language.keywords.length} كلمة مفتاحية، ${types.types.length} نوعاً، ${modules.length} وحدة قياسية.\n` +
      `[meem] الأمثلة: ${examples.length} برنامجاً ${record ? 'سُجّل' : 'طابق مخرجه المسجَّل'} ` +
      `(منها ${expectedErrors} بخطأ ترجمة مقصود)، و${libraries} ملف مكتبة.\n` +
      `[meem] كتل الصفحات: ${fences.checked} فُحصت، ${fences.skipped.length} بلا فحص. الحارس: ${guard.join(' ')}`,
  );
  if (fences.skipped.length) console.log(`       بلا فحص: ${fences.skipped.join('، ')}`);
  if (unguarded.length) console.log(`       أمثلة تحذير مقصود خارج الحارس: ${unguarded.join('، ')}`);
  if (frozen.length) console.log(`       أمثلة مجمَّدة بإصدار أقدم (صفحات تاريخية، لا تُشغَّل): ${frozen.join('، ')}`);
} catch (e) {
  if (e instanceof BuildError) {
    console.error(`\n[فشل البناء] ${e.message}\n`);
    process.exit(1);
  }
  throw e;
}

/** فهرس الرسائل: كل صف من جداول errors/catalog.md، ومعه أمثلة الكتاب التي تطبع الرسالة. */
// قسم «أكثر الرسائل ظهوراً، بمثال» أول الفهرس: عنوان كل رسالة ومثالها.
function parseCatalogTop(text) {
  const lines = text.split('\n');
  const exAt = new Map(parseExamples(text).map((e) => [e.start, e.n]));
  const out = [];
  let inside = false;
  for (let i = 0; i < lines.length; i++) {
    const h2 = /^## (.*)$/.exec(lines[i]);
    if (h2) inside = h2[1].startsWith('أكثر الرسائل ظهوراً');
    if (!inside) continue;
    const h3 = /^### (.*)$/.exec(lines[i]);
    if (h3) out.push({ title: h3[1].trim(), example: null });
    if (exAt.has(i) && out.length && !out.at(-1).example) out.at(-1).example = `errors/catalog.md#${exAt.get(i)}`;
  }
  if (out.some((t) => !t.example)) throw new Error('فهرس الأخطاء: رسالة في «أكثر الرسائل ظهوراً» بلا مثال');
  return out;
}

function parseCatalog(text, examples) {
  const out = [];
  let phase = '';
  for (const line of text.split('\n')) {
    const h = /^## (.*)$/.exec(line);
    if (h) phase = h[1].trim();
    // المعرّف ثابت منذ 0.8.0 (E0136)، ويطبعه المجمّع في وسم الرسالة؛ وقبلها مؤقت (M41D733) مشتق من النص.
    const r = /^\| `(E\d{4}|M[0-9A-F]+)` \| (.*) \| (\d+) \| (.*) \| (.*) \|$/.exec(line);
    if (!r) continue;
    const message = r[2].replace(/\\\|/g, '|');
    // الجزء المتغير: «…» في الفهرس، أو صيغة printf كما في رسائل التشغيل (%s، %lld).
    const parts = message.split(/…|%l{0,2}[dsfgu]/).map((s) => s.trim()).filter((s) => s.length >= 4);
    // بالمعرّف الثابت: المثال الذي يطبع وسم الرسالة «[… E0136]». وللمعرّف المؤقت (قبل 0.8): بنص الرسالة.
    const stable = r[1].startsWith('E');
    const tag = new RegExp(`\\[[^\\]\\n]* ${r[1]}\\]`);
    const uses = stable
      ? Object.values(examples).filter((e) => e.code != null && tag.test(e.stderr + e.stdout)).map((e) => e.id)
      : parts.length
        ? Object.values(examples).filter((e) => parts.every((p) => (e.stderr + e.stdout).includes(p))).map((e) => e.id)
        : [];
    out.push({ id: r[1], phase, message, exit: Number(r[3]), source: r[4].replace(/`/g, ''), reference: r[5].replace(/`/g, ''), examples: uses });
  }
  return out;
}

/** يضيف إلى وصف اللغة ما في جداول المفردات والمدمجات في الكتاب المرجعي ولم يعرفه المجمّع المحلي. للتلوين وحده. */
function mergeHandbookLexicon(language) {
  const lex = readFileSync(path.join(hbDir, 'language/01-lexicon.md'), 'utf8');
  const builtins = readFileSync(path.join(hbDir, 'stdlib/builtins.md'), 'utf8');
  const out = structuredClone(language);
  const have = new Set(out.keywords.map((k) => k.word));
  const section = (title) => lex.split(/^## /m).find((s) => s.startsWith(title)) ?? '';
  for (const row of section('الكلمات المفتاحية').split('\n')) {
    const m = /^\| `([^`]+)` \| ([^|]*) \| (\w+) \| ([^|]*) \|/.exec(row);
    if (!m || m[1].includes(' ') || have.has(m[1])) continue;
    out.keywords.push({ word: m[1], aliases: [], kind: m[3], role: `handbook_${m[1]}`, description: '', opens_block: false, contextual: m[4].trim() === 'نعم' });
  }
  const types = new Set(out.types.map((t) => t.word));
  for (const row of section('الأنواع').split('\n')) {
    const m = /^\| `([^`]+)` \|/.exec(row);
    if (m && !m[1].includes('[') && !types.has(m[1])) out.types.push({ word: m[1], description: '' });
  }
  const ops = new Set(out.operators.map((o) => o.symbol));
  for (const row of section('المعاملات').split('\n')) {
    const m = /^\| `([^`]+)` \| (\w+) \|/.exec(row);
    const sym = m?.[1].replace(/\\\|/g, '|');
    if (sym && !ops.has(sym)) out.operators.push({ symbol: sym, kind: m[2], description: '' });
  }
  const bnames = new Set(out.builtins.map((b) => b.name));
  for (const m of builtins.matchAll(/^## `([^`]+)`/gm)) if (!bnames.has(m[1])) out.builtins.push({ name: m[1], aliases: [], usage: '', summary: '' });
  return out;
}

/** سجل الأمثلة المستبعدة من الملعب وأسبابها: docs/playground-excluded.md في الموقع (يُكتب في كل بناء). */
function writePlaygroundExclusions(allowed, excluded, includeDev, release) {
  const byReason = new Map();
  for (const e of excluded) for (const r of e.reasons) byReason.set(r, (byReason.get(r) ?? 0) + 1);
  const lines = [
    '# أمثلة الكتاب المستبعدة من الملعب',
    '',
    'مولَّد في كل بناء (scripts/prebuild.mjs، والقواعد في scripts/lib/playground.mjs). لا يُحرَّر باليد.',
    '',
    `المتاح في الملعب: ${allowed.length} مثالاً. المستبعد: ${excluded.length}. أمثلة ما بعد ${release}: ${includeDev ? 'مُدخلة' : 'مستبعدة'} (PUBLIC_PLAYGROUND_INCLUDE_DEV).`,
    '',
    '## الأسباب',
    '',
    '| السبب | عدد الأمثلة |',
    '|---|---|',
    ...[...byReason].sort((a, b) => b[1] - a[1]).map(([r, n]) => `| ${r} | ${n} |`),
    '',
    '## كل مثال',
    '',
    '| المثال | الأسباب |',
    '|---|---|',
    ...excluded.map((e) => `| \`${e.id}\` | ${e.reasons.join('؛ ')} |`),
    '',
  ];
  mkdirSync(path.join(root, 'docs'), { recursive: true });
  writeFileSync(path.join(root, 'docs/playground-excluded.md'), lines.join('\n'));
}
