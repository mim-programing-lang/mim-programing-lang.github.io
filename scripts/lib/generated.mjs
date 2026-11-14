// ملفات src/generated: يكتبها prebuild من المجمّع، ويقرؤها البناء احتياطاً حين لا يوجد مجمّع (سير النشر).
import path from 'node:path';
import { root } from './meem.mjs';

export const requiredFiles = [
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

/** مجلد الكتابة: MEEM_GENERATED_DIR إن ضُبط (لفحص check:generated)، وإلا src/generated. */
export const generatedDir = process.env.MEEM_GENERATED_DIR ? path.resolve(process.env.MEEM_GENERATED_DIR) : path.join(root, 'src/generated');
