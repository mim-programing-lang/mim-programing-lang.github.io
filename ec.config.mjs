// إعدادات كتل الكود (Expressive Code). في ملف مستقل ليعمل المكوّن <Code> أيضاً.
import { defineEcConfig } from '@astrojs/starlight/expressive-code';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { meemBidi } from './src/lib/ec-bidi.mjs';

// قواعد التلوين يولّدها scripts/prebuild.mjs من خرج المجمّع قبل كل بناء.
// المسار من جذر المشروع (حيث يُشغَّل npm)، لأن هذا الملف يُحزَّم ويُنفَّذ أيضاً من داخل dist/ أثناء البناء.
const generated = (name) => path.resolve('src/generated', name);
if (!existsSync(generated('meem.tmLanguage.json'))) {
  throw new Error('src/generated غير مولَّد. شغّل البناء بـ npm run build (أو npm run dev)، لا بـ astro مباشرة.');
}
const grammar = JSON.parse(readFileSync(generated('meem.tmLanguage.json'), 'utf8'));
const language = JSON.parse(readFileSync(generated('language.json'), 'utf8'));
const keywords = language.keywords.flatMap((k) => [k.word, ...k.aliases]);

export default defineEcConfig({
  themes: ['github-dark', 'github-light'],
  shiki: { langs: [grammar] },
  plugins: [meemBidi({ keywords, aliases: grammar.aliases })],
  styleOverrides: {
    codeFontFamily: 'var(--sl-font-mono)',
    codeFontSize: '0.95rem',
    codeLineHeight: '1.9',
    borderRadius: '0.5rem',
  },
});
