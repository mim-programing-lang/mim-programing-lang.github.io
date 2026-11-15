// مقارنة أرقام الإصدارات (س.ص.ع). المثال الذي سُجّل مخرجه بإصدار أقدم من الإصدار الذي يبني الموقع ليس «بعد الإصدار»:
// البناء يشغّل الأمثلة كلها بالمجمّع نفسه (scripts/prebuild.mjs). «بعد الإصدار» ما سُجّل بإصدار أحدث منه وحده.
export function compareVersions(a, b) {
  const pa = String(a).split('.').map(Number);
  const pb = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return Math.sign(d);
  }
  return 0;
}
/** المثال سُجّل بإصدار أحدث من الإصدار المعطى (فرع التطوير). */
export const isAfterRelease = (version, release) => compareVersions(version, release) > 0;
