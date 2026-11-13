// لغتان: العربية في الجذر (rtl) والإنجليزية تحت /en/ (ltr).
// المكوّن داخل المحتوى يتبع لغة المحتوى: صفحة إنجليزية لم تُترجم تُعرض بمحتواها العربي، فتبقى مكوّناتها عربية.
// وما حول المحتوى (الرأس، التذييل، الشريط الجانبي) يتبع لغة الواجهة.
import type { AstroGlobal } from 'astro';

export type Lang = 'ar' | 'en';

type Route = { locale?: string; entryMeta?: { lang?: string } };
const route = (Astro: AstroGlobal) => (Astro.locals as { starlightRoute?: Route }).starlightRoute;

export const contentLang = (Astro: AstroGlobal): Lang => (route(Astro)?.entryMeta?.lang === 'en' ? 'en' : 'ar');
export const uiLang = (Astro: AstroGlobal): Lang => (route(Astro)?.locale === 'en' ? 'en' : 'ar');

/** رابط داخلي بلغة: «/learn/» يصير «/en/learn/» للإنجليزية. */
export const localHref = (lang: Lang, href: string) =>
  lang === 'en' && href.startsWith('/') && !href.startsWith('/en/') && href !== '/en' ? `/en${href}` : href;

/** مسار الصفحة بلا بادئة اللغة ولا الشرطتين: «/en/learn/print/» ← «learn/print». */
export const pageSlug = (Astro: AstroGlobal) => Astro.url.pathname.replace(/^\/(en\/?)?|\/$/g, '');
