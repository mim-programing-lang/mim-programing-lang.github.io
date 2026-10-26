// الأمثلة: كل ملف .م تحت examples/ برنامج له مخرج مسجَّل بجواره:
//   اسم.out  المخرج (stdout)        اسم.err  مخرج الخطأ إن وُجد        اسم.exit  رمز الخروج إن لم يكن 0
//   اسم.noguard  مثال يعرض تحذيراً عن قصد: لا يمر بالحارس (يُعدّ في تقرير البناء)
//   اسم.build  المثال يُبنى أيضاً بـ«meem build» ويُشغَّل الملف الناتج ويُقارن مخرجه بالمسجَّل نفسه
//   اسم.doc-out  المخرج كما هو مكتوب في وثيقة المجمّع التي نُقل منها المثال: يُقارن أيضاً
//   اسم.argv  وسائط البرنامج نفسه، وسيط في كل سطر (meem ملف.م -- وسائط؛ وللملف المبني: ./ناتج وسائط)
//   اسم.env   متغيرات بيئة للتشغيل، NAME=value في كل سطر
//   اسم.doc-err / اسم.doc-exit  كما في وثيقة المجمّع، مثل doc-out
//   اسم.warn-ok  مثال منقول من وثيقة المجمّع: الحارس عليه بلا --strict (ومعه --deny-deprecated على مجمّع قبل 0.8)
//   اسم.frozen  مسجَّل بإصدار أقدم (رقم بنائه في الملف) لصفحة تاريخية: لا يُعاد تشغيله، ويُعرض موسوماً بإصداره
//   اسم.in   الإدخال (اختياري)      اسم.args خيارات المجمّع، سطر واحد (اختياري)
// البناء يشغّل المجمّع على كل مثال ويقارن. «npm run examples:record» يسجّل من جديد (راجع الفرق قبل الإيداع).
// ما كان في مجلد اسمه «مكتبات» أو «وحدات» ملف يُستورد لا برنامج: يُفحص ولا يُشغَّل.
//
// حارس الصيغ: «..» ممنوع في كل مثال (scripts/lib/forbidden.mjs). ثم كل مثال (عدا ما سُجّل له خطأ ترجمة مقصود، رمز 2) يُفحص أيضاً بخيارات الحارس،
// فأي تحذير من المجمّع، ومنه تحذيرات الصيغ القديمة، يُفشل البناء.
import { readFileSync, writeFileSync, existsSync, rmSync, readdirSync, statSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { meem, root, BuildError } from './meem.mjs';
import { findConcat } from './forbidden.mjs';

export const examplesDir = path.join(root, 'examples');
const LIB_DIRS = new Set(['مكتبات', 'وحدات']);

const read = (f) => (existsSync(f) ? readFileSync(f, 'utf8') : '');

/**
 * خيارات الحارس. --strict يرقّي التحذيرات إلى أخطاء. وعلى مجمّع يعرف الصيغ المهجورة (0.4 إلى 0.7) يُضاف --deny-deprecated؛
 * ومنذ 0.8.0 الصيغ المهجورة أخطاء ترجمة بذاتها، والخياران --list-deprecated و--deny-deprecated أُزيلا.
 */
export function guardFlags() {
  if (meem(['--list-deprecated', '--json']).status === 0) return ['--json', '--deny-deprecated', '--strict'];
  const opts = meem(['--list-options', '--json']);
  if (opts.status !== 0) throw new BuildError('المجمّع المستعمل لا يعرف --list-deprecated ولا --list-options: أقدم من أن يبني الموقع.');
  return ['--json', '--strict'];
}

/**
 * يفحص ملفاً أو نصاً بـ«meem --check» وخيارات الحارس (guardFlags) ويقرأ التشخيصات.
 * يرجع قائمة مشاكل نصية (فارغة = سليم). الصيغة المهجورة تُذكر بمعرّفها من الحقل deprecated.
 */
export function guardCheck(args, opts, guard) {
  const r = meem(['--check', ...guard, ...args], opts);
  let report;
  try {
    report = JSON.parse(r.stdout);
  } catch {
    return [`خرج الفحص ليس JSON (رمز ${r.status}): ${(r.stdout + r.stderr).trim().slice(0, 300)}`];
  }
  const out = report.diagnostics.map((d) => {
    const kind = d.deprecated ? `صيغة مهجورة (${d.deprecated})` : d.severity === 'error' ? `خطأ ${d.phase_label}` : 'تحذير';
    return `${kind} — سطر ${d.line}:${d.column}: ${d.message}${d.hint ? `\n        ${d.hint}` : ''}`;
  });
  if (r.status !== 0 && !out.length) out.push(`رمز الخروج ${r.status} بلا تشخيص`);
  return r.status === 0 && !report.summary.deprecated ? [] : out;
}

function walk(dir) {
  return readdirSync(dir)
    .sort()
    .flatMap((f) => {
      const p = path.join(dir, f);
      return statSync(p).isDirectory() ? walk(p) : p.endsWith('.م') ? [p] : [];
    });
}

export function runExamples({ record = false, guard = guardFlags(), language } = {}) {
  const failures = [];
  const out = [];
  let libraries = 0;
  let expectedErrors = 0;
  const unguarded = [];
  const frozen = [];
  for (const file of walk(examplesDir)) {
    const id = path.relative(examplesDir, file);
    const cwd = path.dirname(file);
    const name = path.basename(file);
    const base = file.replace(/\.م$/, '');
    const isLibrary = LIB_DIRS.has(path.basename(cwd));
    const problems = [];
    const concat = findConcat(readFileSync(file, 'utf8'), language);
    if (concat.length) problems.push(`عامل الدمج «..» ممنوع في أمثلة الموقع (السطر ${concat.join('، ')})`);
    const check = () => {
      // «.warn-ok»: مثال منقول من وثيقة المجمّع يعرض تحذيراً عن قصد؛ يبقى عليه حارس الصيغ المهجورة وحده.
      const flags = existsSync(`${base}.warn-ok`) ? guard.filter((f) => f !== '--strict') : guard;
      const found = guardCheck([name], { cwd }, flags);
      if (found.length) problems.push(`الحارس رفضه:\n${indent(found.join('\n'))}`);
    };
    if (isLibrary) {
      libraries++;
      check();
      if (problems.length) failures.push(`✗ ${id}\n    ${problems.join('\n    ')}`);
      continue;
    }
    if (existsSync(`${base}.frozen`)) {
      const want = { stdout: read(`${base}.out`), stderr: read(`${base}.err`), exit: Number(read(`${base}.exit`).trim() || 0) };
      out.push({ id, file: name, args: read(`${base}.args`).trim().split(/\s+/).filter(Boolean), argv: [], env: {}, built: null, frozen: read(`${base}.frozen`).trim(), code: readFileSync(file, 'utf8').replace(/\n+$/, ''), stdin: '', ...want });
      frozen.push(id);
      continue;
    }
    const stdin = read(`${base}.in`);
    const args = read(`${base}.args`).trim().split(/\s+/).filter(Boolean);
    const argv = read(`${base}.argv`).split('\n').filter((l) => l !== '');
    const env = Object.fromEntries(read(`${base}.env`).split('\n').filter(Boolean).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
    // يُشغَّل من مجلد عمل مؤقت فارغ (ما يكتبه البرنامج من ملفات يذهب إليه ويُحذف)، وملف المصدر رابط باسمه وحده
    // بجوار ما يستورده، فلا تظهر مسارات هذا الجهاز في المخرجات.
    const work = mkdtempSync(path.join(tmpdir(), 'meem-run-'));
    const r = meem([...args, path.join(cwd, name), ...(argv.length ? ['--', ...argv] : [])], { cwd: work, input: stdin, env });
    rmSync(work, { recursive: true, force: true });
    if (record) {
      writeFileSync(`${base}.out`, r.stdout);
      for (const [ext, v] of [['err', r.stderr], ['exit', r.status ? `${r.status}\n` : '']]) {
        if (v) writeFileSync(`${base}.${ext}`, v);
        else rmSync(`${base}.${ext}`, { force: true });
      }
    }
    if (!existsSync(`${base}.out`)) problems.push('لا مخرج مسجَّل له (npm run examples:record)');
    const want = { stdout: read(`${base}.out`), stderr: read(`${base}.err`), exit: Number(read(`${base}.exit`).trim() || 0) };
    if (r.status !== want.exit) problems.push(`رمز الخروج ${r.status}، والمسجَّل ${want.exit}`);
    if (r.stdout !== want.stdout) problems.push(diff('المخرج', want.stdout, r.stdout));
    if (r.stderr !== want.stderr) problems.push(diff('مخرج الخطأ', want.stderr, r.stderr));
    // مثال منقول من وثيقة في مستودع المجمّع: المكتوب هناك يجب أن يطابق ما يطبعه المجمّع (scripts/import-compiler-docs.mjs).
    if (existsSync(`${base}.doc-out`) && r.stdout !== read(`${base}.doc-out`)) problems.push(diff('المخرج المكتوب في وثيقة المجمّع', read(`${base}.doc-out`), r.stdout));
    if (existsSync(`${base}.doc-err`) && r.stderr !== read(`${base}.doc-err`)) problems.push(diff('مخرج الخطأ المسجَّل في مستودع المجمّع', read(`${base}.doc-err`), r.stderr));
    if (existsSync(`${base}.doc-exit`) && r.status !== Number(read(`${base}.doc-exit`))) problems.push(`رمز الخروج ${r.status}، والمسجَّل في مستودع المجمّع ${read(`${base}.doc-exit`).trim()}`);
    // البناء الفعلي: ملف تنفيذي مستقل، يُشغَّل وحده ويجب أن يطبع ما يطبعه التشغيل المباشر.
    let built = null;
    if (existsSync(`${base}.build`)) {
      const dir = mkdtempSync(path.join(tmpdir(), 'meem-build-'));
      try {
        const exe = path.join(dir, 'program');
        const b = meem(['build', name, '-o', exe, '--json'], { cwd, env });
        let info = null;
        try {
          info = JSON.parse(b.stdout).build;
        } catch {}
        if (b.status !== 0 || !info) problems.push(`meem build فشل (رمز ${b.status}):\n${indent(b.stdout + b.stderr)}`);
        else {
          const run = spawnSync(exe, argv, { input: stdin, encoding: 'utf8', timeout: 60_000, env: {}, cwd: dir });
          if (run.status !== want.exit) problems.push(`الملف المبني خرج بالرمز ${run.status}، والمسجَّل ${want.exit}`);
          if (run.stdout !== want.stdout) problems.push(diff('مخرج الملف المبني', want.stdout, run.stdout ?? ''));
          if (run.stderr !== want.stderr) problems.push(diff('مخرج خطأ الملف المبني', want.stderr, run.stderr ?? ''));
          built = { static: info.static, target: info.target, bytes: statSync(exe).size };
        }
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    }
    if (want.exit === 2) expectedErrors++;
    else if (existsSync(`${base}.noguard`)) unguarded.push(id);
    else check();
    if (problems.length) failures.push(`✗ ${id}\n    ${problems.join('\n    ')}`);
    out.push({ id, file: name, args, argv, env, built, code: readFileSync(file, 'utf8').replace(/\n+$/, ''), stdin, ...want });
  }
  if (failures.length) {
    throw new BuildError(
      `أمثلة فشلت (${failures.length}):\n\n${failures.join('\n\n')}\n\n` +
        'إن كان تغيّر المخرج مقصوداً: npm run examples:record ثم راجع الفرق.',
    );
  }
  return { examples: out, libraries, expectedErrors, unguarded, frozen, guard };
}

const indent = (s) => s.trim().split('\n').map((l) => `      ${l}`).join('\n');

function diff(label, want, got) {
  const a = want.split('\n');
  const b = got.split('\n');
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return `${label} يختلف عند السطر ${i + 1}:\n      المسجَّل: ${JSON.stringify(a[i] ?? '')}\n      الفعلي:  ${JSON.stringify(b[i] ?? '')}`;
}
