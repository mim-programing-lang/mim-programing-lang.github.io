// وحدة الأحجام في الموقع كله: عشرية. ك.ب = 1000 بايت، م.ب = 1000000 بايت (كما يعرضها مدير الملفات و«du --si»).
// «du -h» و Lighthouse يعرضان بالوحدة الثنائية (1024)، فأرقامهما أصغر بنحو 5% لحجم بالميغابايت.
export const kb = (bytes) => (bytes / 1000).toFixed(1);
export const mb = (bytes) => (bytes / 1_000_000).toFixed(1);
export const mbRound = (bytes) => String(Math.round(bytes / 1_000_000));
