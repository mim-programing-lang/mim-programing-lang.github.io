// أقسام الموقع وأشرطتها الجانبية. المصدر الواحد للشريط العلوي وللشريط الجانبي.
// كل قسم مجموعة عليا في sidebar؛ src/routeData.ts يُبقي في كل صفحة مجموعة قسمها وحدها.

export const sections = [
  {
    id: 'learn',
    label: 'تعلّم ميم',
    href: '/learn/',
    items: [
      { label: 'المسار وتقدّمك', slug: 'learn' },
      {
        label: 'المستوى الأول: مبتدئ',
        items: ['learn/print', 'learn/variables', 'learn/input', 'learn/conditions', 'learn/loops', 'learn/lists', 'learn/dictionaries', 'learn/functions', 'learn/structs'],
      },
      { label: 'المستوى الثاني: متوسط', items: ['learn/strings', 'learn/modules', 'learn/files', 'learn/memory', 'learn/enums', 'learn/errors'] },
      { label: 'المستوى الثالث: نظامي', items: ['learn/allocators', 'learn/unsafe', 'learn/build'] },
      {
        label: 'مشاريع صغيرة',
        items: ['learn/projects', 'learn/projects/words', 'learn/projects/sales', 'learn/projects/algorithms', 'learn/projects/tictactoe', 'learn/projects/linecount'],
      },
      'learn/next',
    ],
  },
  {
    id: 'docs',
    label: 'المرجع',
    href: '/docs/',
    items: [
      { label: 'نظرة عامة', slug: 'docs' },
      {
        label: 'افهم ميم',
        items: ['docs/understand/capabilities', 'docs/understand/memory', 'docs/understand/errors', 'docs/understand/unsafe', 'docs/understand/compare'],
      },
      { label: 'من لغة أخرى', items: ['docs/from/c', 'docs/from/python', 'docs/from/zig'] },
      { label: 'مراجع سريعة', items: ['docs/reference', 'docs/cheatsheet', 'docs/glossary', 'docs/stdlib/allocation'] },
      'docs/handbook',
      {
        label: 'اللغة',
        items: [
          'docs/language/lexicon',
          'docs/language/types',
          'docs/language/expressions',
          'docs/language/statements',
          'docs/language/functions',
          'docs/language/structs',
          'docs/language/modules',
          'docs/language/low-level',
          'docs/language/ffi',
          'docs/language/security',
          'docs/language/enums',
          'docs/language/errors',
        ],
      },
      { label: 'الذاكرة اليدوية', items: ['docs/memory', 'docs/memory/reference', 'docs/memory/refcount'] },
      {
        label: 'المكتبة القياسية',
        items: ['docs/stdlib', 'docs/stdlib/builtins', 'docs/stdlib/math', 'docs/stdlib/system', 'docs/stdlib/files', 'docs/stdlib/paths', 'docs/stdlib/random'],
      },
      { label: 'الأخطاء', items: ['docs/errors/common', 'docs/errors/catalog'] },
      { label: 'الأدوات', items: ['docs/tools/options', 'docs/tools/check-json', 'docs/build'] },
      { label: 'الترحيل', items: ['docs/migration/to-0-8', 'docs/migration', 'docs/migration/errors'] },
      { label: 'من خارج الكتاب (0.6)', items: ['docs/performance', 'docs/whats-new'] },
    ],
  },
];

// روابط الشريط العلوي: الأقسام ثم الصفحات المفردة.
export const topNav = [
  ...sections.map(({ label, href }) => ({ label, href })),
  { label: 'أمثلة', href: '/try/' },
  { label: 'الملعب', href: '/playground/' },
  { label: 'التنزيل', href: '/download/' },
  { label: 'دعم', href: '/support/' },
];

// روابط التذييل.
export const footerNav = [
  { label: 'حول المشروع', href: '/about/' },
  { label: 'التنزيل', href: '/download/' },
  { label: 'جرّب 0.9 معنا', href: '/beta/' },
  { label: 'دعم ميم', href: '/support/' },
];

export const sidebar = sections.map(({ label, items }) => ({ label, items }));
