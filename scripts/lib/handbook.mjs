// قراءة الكتاب المرجعي المنسوخ في handbook/ وأمثلته.
//
// المثال في الكتاب كتلة ```ميم تتبعها ```الناتج أو ```خطأ. البيان examples/manifest.json يذكر كل مثال بمساره
// «docs/handbook/<ملف>.md#ن» (ن ترتيبه في الملف من 1) ومعه stdout و stderr ورمز الخروج والإصدار والخيارات.
// البيان لا يحمل الشيفرة: هي الكتلة رقم ن في الملف. هنا تُجمع الشيفرة من الملف والمخرج من البيان، ويُتحقق أن
// ما في الملف (كتلة الناتج أو الخطأ) يطابق البيان.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { root, BuildError } from './meem.mjs';

export const hbDir = path.join(root, 'handbook');

export function hbSource() {
  return JSON.parse(readFileSync(path.join(hbDir, 'SOURCE.json'), 'utf8'));
}

/** كل ملفات md في الكتاب، مساراتها نسبةً إلى handbook/. */
export function hbFiles() {
  const out = [];
  const walk = (d) => {
    for (const f of readdirSync(d).sort()) {
      const p = path.join(d, f);
      if (statSync(p).isDirectory()) {
        if (f !== '_related') walk(p);
      } else if (f.endsWith('.md')) out.push(path.relative(hbDir, p));
    }
  };
  walk(hbDir);
  return out;
}

/** يقسم ملفاً إلى أسطر ويعيد مواضع الأمثلة: {n, start, end, code, kind, shown}. */
export function parseExamples(text) {
  const lines = text.split('\n');
  const found = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/^```ميم\s*$/.test(lines[i])) continue;
    const start = i;
    const code = [];
    for (i++; i < lines.length && !/^```\s*$/.test(lines[i]); i++) code.push(lines[i]);
    let j = i + 1;
    while (j < lines.length && lines[j].trim() === '') j++;
    const m = /^```(الناتج|خطأ)\s*$/.exec(lines[j] ?? '');
    if (!m) continue;
    const shown = [];
    for (j++; j < lines.length && !/^```\s*$/.test(lines[j]); j++) shown.push(lines[j]);
    found.push({ n: found.length + 1, start, end: j, code: code.join('\n'), kind: m[1], shown: shown.join('\n') });
    i = j;
  }
  return found;
}

/** يجمع الأمثلة كلها: الشيفرة من الكتاب، والمخرج من البيان. يرمي إن اختلف الكتاب عن البيان. */
export function hbExamples() {
  const manifest = JSON.parse(readFileSync(path.join(hbDir, 'examples/manifest.json'), 'utf8'));
  const byId = new Map();
  const problems = [];
  const prefix = 'docs/handbook/';
  for (const file of hbFiles()) {
    const text = readFileSync(path.join(hbDir, file), 'utf8');
    const lines = text.split('\n');
    for (const e of parseExamples(text)) {
      // أقرب عنوان فوق المثال: تتحقق به الصفحات التي تستعير مثالاً برقمه (HBExample section).
      let h = e.start;
      while (h >= 0 && !/^#{1,6}\s/.test(lines[h])) h--;
      byId.set(`${file}#${e.n}`, { ...e, file, section: h >= 0 ? lines[h].replace(/^#+\s*/, '').trim() : '' });
    }
  }
  const out = {};
  for (const m of manifest.examples) {
    if (!m.path.startsWith(prefix)) {
      // أمثلة examples/ في المستودع (خارج الكتاب): يذكرها البيان بمخرجها، وشيفرتها ليست في الكتاب.
      out[m.path] = { id: m.path, file: null, code: null, ...pick(m) };
      continue;
    }
    const id = m.path.slice(prefix.length);
    const e = byId.get(id);
    if (!e) {
      problems.push(`${id}: في البيان ولا كتلة مقابلة له في الكتاب`);
      continue;
    }
    byId.delete(id);
    // ما يعرضه الكتاب تحت المثال يجب أن يطابق البيان.
    const shownOk = e.kind === 'الناتج' ? e.shown === m.stdout.replace(/\n$/, '') : e.shown === formatError(m).replace(/\n$/, '');
    if (!shownOk) problems.push(`${id}: كتلة «${e.kind}» في الكتاب لا تطابق مخرج البيان`);
    out[id] = { id, file: e.file, section: e.section, code: e.code, ...pick(m) };
  }
  for (const id of byId.keys()) problems.push(`${id}: كتلة مثال في الكتاب لا يذكرها البيان`);
  return { examples: out, problems, generatedBy: manifest.generated_by, release: manifest.release, development: manifest.development };
}

const pick = (m) => ({ title: m.title, topic: m.topic, tags: m.tags, flags: m.flags, stdout: m.stdout, stderr: m.stderr, exit: m.exit, version: m.version });

export function formatError(m) {
  return `رمز الخروج: ${m.exit}\n--- stdout ---\n${m.stdout}--- stderr ---\n${m.stderr}`;
}

export function assertHandbook() {
  const r = hbExamples();
  if (r.problems.length) throw new BuildError(`الكتاب المرجعي والبيان مختلفان (${r.problems.length}):\n  ${r.problems.join('\n  ')}`);
  return r;
}
