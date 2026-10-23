// يملأ خانة في src/data/downloads.json من ملف مبني: اسمه وحجمه وبصمته SHA-256. لا يرفع شيئاً ولا يخترع رابطاً.
//
//   node scripts/make-downloads.mjs --slot compiler-linux-x86_64 --file /مسار/meem-0.7.0-linux-x86_64.tar.xz \
//        [--info /مسار/bundle-info.json] [--dir /مسار/الحزمة-مفكوكة] [--url https://...]
//   node scripts/make-downloads.mjs --slot editor-linux-deb --file /مسار/meem-editor_0.x_amd64.deb --version 0.x [--url ...]
//   node scripts/make-downloads.mjs --slot editor-linux-appimage --file /مسار/meem-editor-0.x.AppImage --version 0.x [--url ...]
//   --require «نص»  (يتكرر) متطلب يُضاف كما هو، من وثيقة الإصدار (مثلاً حزم التوزيعة التي يعتمد عليها deb)
//   node scripts/make-downloads.mjs --slot <id> --clear     يعيد الخانة فارغة («قريباً»)
//
// الخانات: compiler-linux-x86_64، editor-linux-deb، editor-linux-appimage (لا ويندوز ولا ماك).
// للمجمّع: الإصدار والبناء من ملف معلومات الحزمة (bundle-info.json، يُبحث عنه بجوار الملف إن لم يُذكر)؛ ومع --dir (الحزمة
// مفكوكة) يُقاس أعلى إصدار glibc تطلبه ملفاتها (objdump) ويُكتب في المتطلبات. الرابط يبقى فارغاً ما لم يُمرَّر --url.
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { root } from './lib/meem.mjs';

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const fail = (m) => {
  console.error(`[make-downloads] ${m}`);
  process.exit(1);
};

const file = path.join(root, 'src/data/downloads.json');
const data = JSON.parse(readFileSync(file, 'utf8'));
const slotId = opt('slot');
const slot = data.products.find((p) => p.id === slotId);
if (!slot) fail(`خانة غير معروفة «${slotId ?? ''}». الخانات: ${data.products.map((p) => p.id).join('، ')}`);

if (args.includes('--clear')) {
  Object.assign(slot, { build: '', fileName: '', bytes: null, sha256: '', url: '', requires: [] });
  if (slot.id !== 'compiler-linux-x86_64') slot.version = '';
  writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  console.log(`[make-downloads] ${slot.id}: أُفرغت.`);
  process.exit(0);
}

const target = opt('file');
if (!target || !existsSync(target) || !statSync(target).isFile()) fail(`ليس ملفاً: ${target ?? '(لم يُذكر --file)'}`);
const hash = createHash('sha256');
for await (const chunk of createReadStream(target)) hash.update(chunk);

const requires = ['لينكس x86_64'];
const extra = args.flatMap((a, i) => (a === '--require' ? [args[i + 1]] : []));
if (slot.id === 'compiler-linux-x86_64') {
  const base = target.replace(/\.(tar(\.(xz|gz|zst))?|zip)$/, '');
  const infoPath = opt('info') ?? [`${base}.json`, path.join(path.dirname(target), 'bundle-info.json')].find((f) => f !== target && existsSync(f));
  if (!infoPath) fail('لم أجد ملف معلومات الحزمة (bundle-info.json). مرّره بـ --info.');
  const info = JSON.parse(readFileSync(infoPath, 'utf8'));
  slot.version = info.version;
  slot.build = info.build ?? info.version;
  if (opt('dir')) {
    const glibc = measureGlibc(opt('dir'));
    if (glibc) requires.push(`مكتبة glibc بإصدار ${glibc} أو أحدث (مقيس على ملفات الحزمة)`);
    else console.warn('[make-downloads] تعذّر قياس glibc (هل objdump مثبَّت؟): لم يُكتب في المتطلبات.');
  }
} else {
  if (!opt('version')) fail('ملف المحرر يحتاج --version.');
  slot.version = opt('version');
  slot.build = opt('build') ?? '';
}
requires.push(...extra);
Object.assign(slot, {
  fileName: path.basename(target),
  bytes: statSync(target).size,
  sha256: hash.digest('hex'),
  url: opt('url') ?? '',
  requires,
});
writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
console.log(`[make-downloads] ${slot.id}: ${slot.fileName}، ${(slot.bytes / 1e6).toFixed(1)} م.ب، SHA-256 ${slot.sha256}${slot.url ? `، ${slot.url}` : '، بلا رابط («قريباً»)'}`);

/** أعلى إصدار GLIBC تطلبه ملفات الحزمة المفكوكة، أو null إن تعذّر القياس. */
function measureGlibc(dir) {
  const files = [];
  const walk = (d) => {
    for (const f of readdirSync(d)) {
      const p = path.join(d, f);
      const st = statSync(p);
      if (st.isDirectory()) walk(p);
      else if (/\.so(\.|$)/.test(f) || (st.mode & 0o111 && !f.includes('.'))) files.push(p);
    }
  };
  walk(dir);
  let best = null;
  for (const f of files) {
    const r = spawnSync('objdump', ['-T', f], { encoding: 'utf8', maxBuffer: 64 << 20 });
    if (r.error) return null;
    for (const m of (r.stdout ?? '').matchAll(/GLIBC_(\d+)\.(\d+)/g)) {
      const v = [Number(m[1]), Number(m[2])];
      if (!best || v[0] > best[0] || (v[0] === best[0] && v[1] > best[1])) best = v;
    }
  }
  return best ? best.join('.') : null;
}
