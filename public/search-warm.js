// يهيّئ بحث Pagefind قبل أول استعلام: يبدأ عامله ويحمّل فهرسه حين يفرغ المتصفح، أو فور لمس زر البحث أيهما أسبق.
// واجهة Starlight تستورد الملف نفسه (/pagefind/pagefind.js) فتجد النسخة المهيّأة، فلا ينتظر أول بحث تحميل الفهرس
// على الصفحات الكبيرة (فهرس الأخطاء). لا شبكة غير ملفات الموقع نفسه.
let started = false;
const warm = () => {
  if (started) return;
  started = true;
  import('/pagefind/pagefind.js')
    .then((pf) => pf.init())
    .catch(() => {
      // البحث يعمل بلا التهيئة المسبقة، كما كان.
    });
};
for (const type of ['pointerenter', 'focusin', 'touchstart']) {
  document.addEventListener(
    type,
    (e) => {
      if (e.target instanceof Element && e.target.closest('site-search')) warm();
    },
    { passive: true, capture: true },
  );
}
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') warm();
});
const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1500));
if (document.readyState === 'complete') idle(warm, { timeout: 4000 });
else window.addEventListener('load', () => idle(warm, { timeout: 4000 }), { once: true });
