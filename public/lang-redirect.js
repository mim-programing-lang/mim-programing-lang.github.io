// التحويل التلقائي إلى الإنجليزية: زائر لغة متصفحه الأولى إنجليزية، ولم يختر لغة من قبل بزر اللغة، يُنقل من الصفحة
// العربية إلى مقابلتها تحت /en/. ولغة الجهاز العربية أو غيرها تبقى عربية. اختيار الزر (localStorage «meem-lang») يتغلب
// دائماً. لا تحويل لمحركات البحث وأدوات الفحص: تجد كل لغة بروابط hreflang.
// سكربت عادي (لا module) في رأس الصفحة، فيُنفَّذ قبل رسمها.
(function () {
  try {
    var path = location.pathname;
    if (path === '/en' || path.indexOf('/en/') === 0) return;
    if (/bot|crawl|spider|slurp|archiver|preview|lighthouse|facebookexternalhit|embedly|whatsapp|telegram/i.test(navigator.userAgent)) return;
    var choice = null;
    try {
      choice = localStorage.getItem('meem-lang');
    } catch (e) {
      // التخزين غير متاح: لا اختيار محفوظ.
    }
    if (choice) return;
    var first = (navigator.languages && navigator.languages[0]) || navigator.language || '';
    if (!/^en(-|$)/i.test(first)) return;
    location.replace('/en' + path + location.search + location.hash);
  } catch (e) {
    // أي خطأ: تبقى الصفحة العربية.
  }
})();
