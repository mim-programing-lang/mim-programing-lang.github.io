// اتجاه كود ميم داخل الصفحات.
//
// سطر ميم فقرة من اليمين إلى اليسار، وفيه أرقام ورموز لاتينية. لو تُرك لخوارزمية الاتجاه وحدها لتغيّر ترتيب
// القطع بحسب الفراغات: «[1, 2, 3]» تُعرض من اليمين و«[1,2,3]» تُعرض من اليسار. لذلك تُعزل كل قطعة (token)
// عن جاراتها (unicode-bidi: isolate في site.css)، فيجري ترتيب القطع دائماً من اليمين، وداخل القطعة اتجاهها هي.
//
// الاستثناء الوحيد هنا: السالب الملتصق بعدد («-5») يُضم إلى العدد في قطعة واحدة يسارية، فيُعرض «-5» لا «5-».
import { definePlugin } from '@astrojs/starlight/expressive-code';

const text = (n) => (n.type === 'text' ? n.value : (n.children ?? []).map(text).join(''));
const isEl = (n) => n.type === 'element';

/**
 * @param {{keywords: string[], aliases: string[]}} options
 *   keywords: كلمات اللغة (من المجمّع): بعدها يكون «-» سالباً لا طرحاً.
 *   aliases: أسماء اللغة في أسوار الكود (```ميم)، تُوحَّد إلى meem ليصير data-language واحداً.
 */
export function meemBidi({ keywords, aliases = [] }) {
  const names = new Set(aliases);
  const kw = new Set(keywords);
  // «-» سالب إن جاء أول السطر، أو بعد رمز ليس معامَلاً، أو بعد كلمة مفتاحية.
  const isUnary = (before) => {
    const s = before.trimEnd();
    if (s === '' || /[=(\[{,:<>!+\-*\/%.]$/.test(s)) return true;
    return kw.has(s.split(/[\s()\[\]{},:]+/).pop());
  };

  return definePlugin({
    name: 'meem-bidi',
    hooks: {
      preprocessLanguage: ({ codeBlock }) => {
        if (names.has(codeBlock.language)) codeBlock.language = 'meem';
      },
      postprocessRenderedLine: ({ codeBlock, renderData }) => {
        if (codeBlock.language !== 'meem') return;
        const visit = (parent) => {
          const kids = parent.children ?? [];
          for (let i = 0; i < kids.length - 1; i++) {
            const a = kids[i];
            const b = kids[i + 1];
            if (!isEl(a) || !isEl(b)) continue;
            const m = /^(.*?)-$/s.exec(text(a));
            if (!m || !/^\d/.test(text(b))) continue;
            if (!isUnary(kids.slice(0, i).map(text).join('') + m[1])) continue;
            const part = (value) => ({ ...a, children: [{ type: 'text', value }] });
            const joined = {
              type: 'element',
              tagName: 'span',
              properties: { className: ['meem-ltr'] },
              children: [part('-'), b],
            };
            kids.splice(i, 2, ...(m[1] ? [part(m[1]), joined] : [joined]));
          }
          for (const k of kids) if (isEl(k) && !(k.properties?.className ?? []).includes('meem-ltr')) visit(k);
        };
        visit(renderData.lineAst);
      },
    },
  });
}
