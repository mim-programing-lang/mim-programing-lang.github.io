// رقم الإصدار المعروض في الموقع: يُقرأ من خانة المجمّع في downloads.json (scripts/make-downloads.mjs)، لا يُكتب باليد.
// فحين يُحدَّث downloads.json عند النشر يتغير الشريط وجدول المواصفات معه.
import downloads from '../data/downloads.json';

const compiler = (downloads.products as { id: string; version: string }[]).find((p) => p.id === 'compiler-linux-x86_64');
if (!compiler?.version) throw new Error('downloads.json: لا رقم إصدار لخانة المجمّع (compiler-linux-x86_64)');

/** الإصدار الكامل للتنزيل الحالي، مثل 0.10.0. */
export const releaseVersion: string = compiler.version;
/** الإصدار بلا رقم التصحيح، مثل 0.10. */
export const releaseMinor: string = releaseVersion.split('.').slice(0, 2).join('.');
