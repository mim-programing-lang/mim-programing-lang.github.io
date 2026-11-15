// GitHub Pages تخدم 404.html (العربية) لكل عنوان غير موجود، ومنه ما تحت /en/. فإن بدأ المسار بـ /en/ نُقل الزائر إلى
// صفحة «غير موجودة» الإنجليزية /en/404/. يُحمَّل في 404.html وحده (src/content/docs/404.md)، قبل رسم الصفحة.
(function () {
  try {
    var path = location.pathname;
    if ((path === '/en' || path.indexOf('/en/') === 0) && path.indexOf('/en/404') !== 0) location.replace('/en/404/');
  } catch (e) {
    // تبقى الصفحة العربية.
  }
})();
