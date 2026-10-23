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

// روابط GitHub: فارغة الآن. ما كان فارغاً لا يظهر في الموقع.
export const links = {
  compilerRepo: '',
  editorRepo: '',
  siteRepo: '',
  issues: '',
  discussions: '',
};
