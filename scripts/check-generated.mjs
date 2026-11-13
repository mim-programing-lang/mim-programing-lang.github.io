// يتحقق أن src/generated (مودَع لأن سير النشر يبني بلا مجمّع) مكتمل وحديث.
// بلا مجمّع (سير النشر): الملفات كلها موجودة وتُقرأ، وإصدار المجمّع فيها هو إصدار التنزيل الحالي في downloads.json.
// بالمجمّع (MEEM_BIN): يولّدها من جديد في مجلد مؤقت ويقارنها بايتاً بايتاً بالمودَعة.
//   npm run check:generated
import { existsSync, readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { meem, root, MEEM_BIN } from './lib/meem.mjs';
import { requiredFiles } from './lib/generated.mjs';

const dir = path.join(root, 'src/generated');
const problems = [];

for (const f of requiredFiles) {
  const p = path.join(dir, f);
  if (!existsSync(p)) problems.push(`ملف غائب: src/generated/${f}`);
  else if (f.endsWith('.json')) {
    try {
      JSON.parse(readFileSync(p, 'utf8'));
    } catch (e) {
      problems.push(`JSON لا يُقرأ: src/generated/${f} (${e.message})`);
    }
  }
}

const downloads = JSON.parse(readFileSync(path.join(root, 'src/data/downloads.json'), 'utf8'));
const compiler = downloads.products.find((p) => p.id === 'compiler-linux-x86_64');
let built = '';
try {
  built = JSON.parse(readFileSync(path.join(dir, 'version.json'), 'utf8')).build;
} catch {}
if (compiler?.build && built !== compiler.build)
  problems.push(`src/generated من المجمّع ${built || '؟'}، والتنزيل الحالي ${compiler.build}: شغّل البناء بمجمّع التنزيل وأودِع src/generated`);

let available = false;
try {
  available = meem(['--version']).status === 0;
} catch {}

if (available && !problems.length) {
  const tmp = mkdtempSync(path.join(tmpdir(), 'meem-generated-'));
  try {
    const r = spawnSync(process.execPath, [path.join(root, 'scripts/prebuild.mjs')], {
      env: { ...process.env, MEEM_GENERATED_DIR: tmp },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (r.status !== 0) problems.push(`فشل التوليد بالمجمّع:\n${r.stdout}${r.stderr}`);
    else
      for (const f of requiredFiles) {
        const fresh = readFileSync(path.join(tmp, f));
        if (!fresh.equals(readFileSync(path.join(dir, f)))) problems.push(`src/generated/${f} قديم: يختلف عما يولّده ${MEEM_BIN}`);
      }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

if (problems.length) {
  console.error(`[check:generated] فشل:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log(
  `[check:generated] src/generated مكتمل (${requiredFiles.length} ملفاً) ومن المجمّع ${built}` +
    (available ? '، ويطابق ما يولّده المجمّع الآن بايتاً بايتاً.' : '. بلا مجمّع: لم يُقارَن بتوليد جديد.'),
);
