// إعدادات الموقع في مكان واحد. عدّل هنا لا في الصفحات.

// عنوان الموقع المنشور (GitHub Pages بالنطاق meemlang.org، منذ 2026-10-23). متغير البيئة SITE_URL يتجاوزه عند البناء.
// يطابق public/CNAME.
export const SITE_URL = process.env.SITE_URL || 'https://meemlang.org';

export const site = {
  name: 'ميم',
  command: 'meem',
  // التعريف في الرئيسية وفي وصف الموقع، والشعار تحته.
  tagline: 'ميم: لغة برمجة عربية الكلمات والاتجاه، تُترجم إلى برامج تنفيذية مستقلة',
  slogan: 'لا حدود لتقنية مع ميم',
  status: 'بيتا',
};

// رابط التبرع عبر PayPal (صفحة «دعم»): متغير البناء PUBLIC_PAYPAL_DONATE_URL، إعداد عام لا سر. رابط عادي يُفتح في
// تبويب جديد، لا سكربت PayPal. فارغاً: الصفحة «قريباً» والزر معطّل ولا رابط PayPal في الموقع. غير ذلك يفشل البناء.
export const donateUrl = (process.env.PUBLIC_PAYPAL_DONATE_URL ?? '').trim();
if (donateUrl && !/^https:\/\/www\.paypal\.com\/[^\s"'<>]*$/.test(donateUrl)) {
  throw new Error(`PUBLIC_PAYPAL_DONATE_URL يجب أن يبدأ بـ https://www.paypal.com/ (القيمة الحالية مرفوضة: ${donateUrl})`);
}

// روابط GitHub: فارغة الآن. ما كان فارغاً لا يظهر في الموقع.
export const links = {
  compilerRepo: '',
  editorRepo: '',
  siteRepo: '',
  issues: '',
  discussions: '',
};
