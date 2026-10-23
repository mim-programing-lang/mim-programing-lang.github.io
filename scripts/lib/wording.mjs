// طبقة الصياغة: scripts/lib/wording.json. تُطبَّق على النثر وحده، وتُفحص بها الصفحات المبنية.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const wording = JSON.parse(readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'wording.json'), 'utf8'));

/** يطبّق replacements على سطر Markdown، متخطياً الشيفرة داخل السطر وأهداف الروابط والوسوم. يعيد [السطر، عدد التغييرات]. */
export function applyWording(line, stats = {}) {
  let count = 0;
  const parts = line.split(/(`+[^`]*`+|\]\([^)]*\)|<[^>]+>)/);
  const out = parts.map((part, i) => {
    if (i % 2) return part;
    for (const { from, to } of wording.replacements) {
      if (part.includes(from)) {
        const n = part.split(from).length - 1;
        count += n;
        stats[from] = (stats[from] ?? 0) + n;
        part = part.split(from).join(to);
      }
    }
    return part;
  });
  return [out.join(''), count];
}

/** يفحص نثر صفحة مبنية (من scripts/lib/prose.mjs) ويعيد المخالفات: [{use, text}]. */
export function checkWording(prose) {
  const found = [];
  for (const line of prose.split('\n')) {
    for (const rule of wording.forbidden) {
      let text = line;
      if (rule.outsideQuotes) text = text.replace(/«[^»]*»/g, '«»');
      for (const e of rule.except ?? []) text = text.split(e).join('');
      if (new RegExp(rule.pattern, 'u').test(text)) found.push({ use: rule.use, text: line.slice(0, 160) });
    }
  }
  return found;
}

/** يطبّق applyWording على نص Markdown كامل، متخطياً الكتل المسوَّرة (```) وأسطر import والمكوّنات. */
export function applyWordingMarkdown(text, stats = {}) {
  let fenced = false;
  return text
    .split('\n')
    .map((line) => {
      if (/^\s*```/.test(line)) {
        fenced = !fenced;
        return line;
      }
      if (fenced || /^(import |<[A-Z])/.test(line)) return line;
      return applyWording(line, stats)[0];
    })
    .join('\n');
}
