// جولات Lighthouse لا تُقاس إلا والجهاز هادئ: قبل كل جولة يُطبع متوسط الحمل (دقيقة واحدة)، وتُنتظر قيمة أقل من الحد.
// جولة لم يهدأ الجهاز لها في المهلة لا تُشغَّل ولا تُسجَّل.
// الاستعمال: npm run lighthouse:rounds [-- --rounds 3 --max-load 2 --wait-minutes 8]
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { root } from './lib/meem.mjs';

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? Number(process.argv[i + 1]) : def;
};
const rounds = arg('rounds', 3);
const maxLoad = arg('max-load', 2);
const waitMs = arg('wait-minutes', 8) * 60_000;
const load = () => Number(readFileSync('/proc/loadavg', 'utf8').split(' ')[0]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

for (let i = 1; i <= rounds; i++) {
  const start = Date.now();
  while (load() >= maxLoad && Date.now() - start < waitMs) await sleep(15_000);
  const before = load();
  if (before >= maxLoad) {
    console.log(`الجولة ${i}: الحمل ${before} ≥ ${maxLoad} بعد انتظار ${Math.round(waitMs / 60000)} د — لم تُقَس.`);
    continue;
  }
  console.log(`الجولة ${i}: الحمل قبلها ${before}`);
  const r = spawnSync('node', [path.join(root, 'scripts/lighthouse.mjs')], { encoding: 'utf8' });
  process.stdout.write(r.stdout.split('\n').filter((l) => l.startsWith('/')).join('\n') + '\n');
}
