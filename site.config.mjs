// إعدادات الموقع في مكان واحد. عدّل هنا لا في الصفحات.

// عنوان الموقع المنشور (GitHub Pages، من الجذر). متغير البيئة SITE_URL يتجاوزه عند البناء.
// النطاق meemlang.org لم يُربط بعد: خطواته في DEPLOY.md، ولا يُكتب هنا قبل تفعيله.
export const SITE_URL = process.env.SITE_URL || 'https://mim-programing-lang.github.io';

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
