// كتل الكود المكتوبة داخل الصفحات (```ميم): كل كتلة تُفحص بالمجمّع وبخيارات الحارس نفسها.
// كتلة لا تصلح برنامجاً وحدها تُكتب ```ميم nocheck وتُعدّ في تقرير البناء.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { meem, root, BuildError } from './meem.mjs';
import { findConcat } from './forbidden.mjs';
import { guardCheck } from './examples.mjs';

const docs = path.join(root, 'src/content/docs');
const walk = (d) =>
  readdirSync(d).flatMap((f) => {
    const p = path.join(d, f);
    return statSync(p).isDirectory() ? walk(p) : /\.mdx?$/.test(p) ? [p] : [];
  });

export function checkFences({ names, guard, language }) {
  const langs = new Set(names);
  const failures = [];
  let checked = 0;
  const skipped = [];
  for (const file of walk(docs)) {
    const lines = readFileSync(file, 'utf8').split('\n');
    for (let i = 0; i < lines.length; i++) {
      const open = /^(\s*)(`{3,})(\S+)\s*(.*)$/.exec(lines[i]);
      if (!open || !langs.has(open[3])) continue;
      const start = i + 1;
      const body = [];
      for (i++; i < lines.length && !lines[i].trim().startsWith(open[2]); i++) body.push(lines[i].slice(open[1].length));
      const where = `${path.relative(root, file)}:${start}`;
      const concat = findConcat(body.join('\n'), language);
      if (concat.length) failures.push(`✗ ${where}\n      عامل الدمج «..» ممنوع في أمثلة الموقع (سطر الكتلة ${concat.join('، ')})`);
      if (/\bnocheck\b/.test(open[4])) {
        skipped.push(where);
        continue;
      }
      checked++;
      const found = guardCheck(['--stdin', 'كتلة.م'], { input: body.join('\n') + '\n' }, guard);
      if (found.length) failures.push(`✗ ${where}\n${found.map((l) => `      ${l}`).join('\n')}`);
    }
  }
  if (failures.length) throw new BuildError(`كتل كود في الصفحات رفضها المجمّع (${failures.length}):\n\n${failures.join('\n\n')}`);
  return { checked, skipped };
}
