// تشغيل المجمّع الحقيقي وقت البناء، عبر MEEM_BIN (الافتراضي: meem من PATH).
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const envFile = path.join(root, '.env');
if (existsSync(envFile)) {
  // لا يغيّر ما هو مضبوط في البيئة أصلاً.
  const before = { ...process.env };
  process.loadEnvFile(envFile);
  Object.assign(process.env, before);
}

export const MEEM_BIN = process.env.MEEM_BIN || 'meem';

export class BuildError extends Error {}

function missing() {
  return new BuildError(
    [
      `لم أجد المجمّع: «${MEEM_BIN}».`,
      'بناء الموقع يشغّل المجمّع الحقيقي لتوليد المراجع وللتحقق من الأمثلة.',
      'اضبط متغير البيئة MEEM_BIN على مسار الأمر meem، مثلاً:',
      '  MEEM_BIN=/مسار/إلى/meem npm run build',
      'أو اكتبه في ملف .env بجوار package.json (انظر .env.example).',
    ].join('\n'),
  );
}

/** يشغّل المجمّع ويرجع {status, stdout, stderr}. لا يرمي عند رمز خروج غير صفري. */
export function meem(args, { cwd, input, env } = {}) {
  const r = spawnSync(MEEM_BIN, args, {
    cwd,
    input,
    encoding: 'utf8',
    timeout: 300_000,
    env: { ...process.env, ...env },
  });
  if (r.error) {
    if (r.error.code === 'ENOENT' || r.error.code === 'EACCES') throw missing();
    throw new BuildError(`تعذّر تشغيل المجمّع «${MEEM_BIN}»: ${r.error.message}`);
  }
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

/** يشغّل أمراً يُنتظر نجاحه ويرجع JSON. */
export function meemJson(args, opts) {
  const r = meem([...args, '--json'], opts);
  if (r.status !== 0) {
    throw new BuildError(`فشل «meem ${args.join(' ')} --json» (رمز ${r.status}):\n${r.stderr || r.stdout}`);
  }
  try {
    return JSON.parse(r.stdout);
  } catch {
    throw new BuildError(`خرج «meem ${args.join(' ')} --json» ليس JSON صالحاً.`);
  }
}
