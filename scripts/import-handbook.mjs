// ينسخ الكتاب المرجعي من مستودع المجمّع إلى handbook/ في الموقع: الوثائق والأمثلة فقط، من إيداع محدد.
// يقرأ بـ git archive ولا يكتب في مستودع المجمّع. الموقع يُبنى من هذه النسخة، لا من المستودع مباشرة.
// الاستعمال: HANDBOOK_COMMIT=36f4ae6 COMPILER_REPO=../my_compiler npm run import-handbook
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync, mkdtempSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { root } from './lib/meem.mjs';

const repo = path.resolve(process.env.COMPILER_REPO ?? path.join(root, '../my_compiler'));
const commit = process.env.HANDBOOK_COMMIT ?? '36f4ae6';
// ما يُنسخ: الكتاب كله، ووثيقتا الملعب والجاهزية اللتان يحيل إليهما.
const PATHS = ['docs/handbook', 'docs/playground.md', 'docs/v1-readiness.md'];

const full = spawnSync('git', ['-C', repo, 'rev-parse', commit], { encoding: 'utf8' });
if (full.status !== 0) {
  console.error(`[import-handbook] الإيداع ${commit} غير موجود في ${repo}.`);
  process.exit(1);
}
const tmp = mkdtempSync(path.join(tmpdir(), 'meem-handbook-'));
try {
  const archive = spawnSync('git', ['-C', repo, 'archive', '--format=tar', commit, ...PATHS], { maxBuffer: 256 << 20 });
  if (archive.status !== 0) throw new Error(archive.stderr.toString());
  const untar = spawnSync('tar', ['-x', '-C', tmp], { input: archive.stdout });
  if (untar.status !== 0) throw new Error(untar.stderr.toString());
  const dest = path.join(root, 'handbook');
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  cpSync(path.join(tmp, 'docs/handbook'), dest, { recursive: true });
  mkdirSync(path.join(dest, '_related'), { recursive: true });
  cpSync(path.join(tmp, 'docs/playground.md'), path.join(dest, '_related/playground.md'));
  cpSync(path.join(tmp, 'docs/v1-readiness.md'), path.join(dest, '_related/v1-readiness.md'));
  writeFileSync(path.join(dest, 'SOURCE.json'), JSON.stringify({ repo: 'my_compiler', branch: '0.7.0-dev', commit: full.stdout.trim(), paths: PATHS }, null, 2) + '\n');
  console.log(`[import-handbook] docs/handbook عند ${full.stdout.trim().slice(0, 7)} ← handbook/`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
