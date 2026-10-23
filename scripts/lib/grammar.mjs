// يولّد قواعد التلوين (TextMate) للغة ميم من خرج «meem --list-keywords --json».
// الكلمات كلها من المجمّع؛ هنا البنية فقط، وهي مربوطة بالحقول الثابتة في عقد الأدوات (role, kind, contextual).

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\\/-]/g, '\\$&');
const alt = (words) =>
  [...new Set(words)]
    .sort((a, b) => b.length - a.length)
    .map((w) => w.split(/\s+/).map(esc).join('\\s+'))
    .join('|');

export function buildGrammar(lang) {
  const stop = `\\s${esc(lang.identifier_stop_chars)}`;
  // حدّ الاسم كما يراه المجمّع: ما ليس فراغاً ولا من محارف الإيقاف جزء من اسم.
  const L = `(?<![^${stop}])`;
  const R = `(?![^${stop}])`;
  const ident = `[^${stop}\\d][^${stop}]*`;
  const word = (words) => `${L}(?:${alt(words)})${R}`;

  const kw = lang.keywords;
  const withAliases = (list) => list.flatMap((k) => [k.word, ...(k.aliases ?? [])]);
  const byRole = (role) => withAliases(kw.filter((k) => k.role === role));
  const plain = kw.filter((k) => !k.contextual && k.role !== 'default_case');
  const ofKind = (...kinds) => withAliases(plain.filter((k) => kinds.includes(k.kind)));

  const control = [
    ...lang.compound_keywords.map((k) => k.words),
    ...ofKind('control', 'loop', 'jump'),
  ];
  const declaration = ofKind('definition', 'declaration');
  const logic = ofKind('logic');
  const known = new Set(['control', 'loop', 'jump', 'definition', 'declaration', 'logic']);
  // صنف جديد يضيفه المجمّع لاحقاً يُلوَّن كلمةً مفتاحية عامة بدل أن يسقط.
  const other = withAliases(plain.filter((k) => !known.has(k.kind)));

  const fn = byRole('function_definition');
  const struct = byRole('struct_definition');
  const imp = byRole('import');
  const ext = byRole('extern_declaration');
  const alias = byRole('alias');
  const priv = byRole('private_modifier');
  const glob = byRole('global_declaration');
  const kase = byRole('case');
  const dflt = byRole('default_case');

  const types = lang.types.map((t) => t.word);
  const externTypes = lang.extern_types.map((t) => t.word);
  const constants = lang.constants.map((c) => c.word);
  const builtins = lang.builtins.flatMap((b) => [b.name, ...(b.aliases ?? [])]);
  const wordOps = new Set(logic);
  const symbolOps = lang.operators.map((o) => o.symbol).filter((s) => !wordOps.has(s));

  const q = esc(lang.string.quote);
  const cq = esc(lang.string.char_quote);
  const escapes = lang.string.escapes.map(esc).join('');

  const patterns = [];
  const repository = {};
  const add = (name, rule) => {
    repository[name] = rule;
    patterns.push({ include: `#${name}` });
  };

  add('comment', { name: 'comment.line.number-sign.meem', match: `${esc(lang.comment)}.*$` });
  add('string', {
    name: 'string.quoted.double.meem',
    begin: q,
    end: `${q}|$`,
    patterns: [{ name: 'constant.character.escape.meem', match: `\\\\[${escapes}]` }],
  });
  add('char', {
    name: 'string.quoted.single.meem',
    begin: cq,
    end: `${cq}|$`,
    patterns: [{ name: 'constant.character.escape.meem', match: `\\\\[${escapes}]` }],
  });

  // سطر «استورد ...»: فيه تكون «باسم» مفتاحية.
  if (imp.length) {
    add('import', {
      begin: `^\\s*(${alt(imp)})${R}`,
      end: '$',
      beginCaptures: { 1: { name: 'keyword.control.import.meem' } },
      patterns: [
        { include: '#comment' },
        { include: '#string' },
        ...(alias.length ? [{ name: 'keyword.control.import.meem', match: word(alias) }] : []),
        { name: 'entity.name.namespace.meem', match: `${L}${ident}` },
      ],
    });
  }
  // سطر «خارجي ...»: أنواع التواقيع الخارجية و«باسم» مفتاحية فيه فقط.
  if (ext.length) {
    add('extern', {
      begin: `^\\s*${priv.length ? `(?:(${alt(priv)})\\s+)?` : '()'}(${alt(ext)})${R}`,
      end: '$',
      beginCaptures: { 1: { name: 'storage.modifier.meem' }, 2: { name: 'storage.type.extern.meem' } },
      patterns: [
        { include: '#comment' },
        { include: '#string' },
        ...(alias.length ? [{ name: 'keyword.other.alias.meem', match: word(alias) }] : []),
        { include: '#definition' },
        { name: 'support.type.meem', match: word([...externTypes, ...types]) },
        { include: '#punctuation' },
      ],
    });
  }
  if (priv.length) {
    add('private', {
      match: `^\\s*(${alt(priv)})(?=\\s+(?:${alt([...fn, ...struct, ...byRole('constant_declaration'), ...ext])})${R})`,
      captures: { 1: { name: 'storage.modifier.meem' } },
    });
  }
  if (glob.length) {
    add('global', {
      match: `^\\s+(${alt(glob)})(?=\\s+${ident})`,
      captures: { 1: { name: 'storage.modifier.meem' } },
    });
  }
  if (kase.length && dflt.length) {
    add('default-case', {
      match: `${L}(${alt(kase)})\\s+(${alt(dflt)})(?=\\s*:)`,
      captures: { 1: { name: 'keyword.control.meem' }, 2: { name: 'keyword.control.meem' } },
    });
  }
  const defRules = [];
  if (fn.length)
    defRules.push({
      match: `${L}(${alt(fn)})\\s+(${ident})`,
      captures: { 1: { name: 'storage.type.function.meem' }, 2: { name: 'entity.name.function.meem' } },
    });
  if (struct.length)
    defRules.push({
      match: `${L}(${alt(struct)})\\s+(${ident})`,
      captures: { 1: { name: 'storage.type.struct.meem' }, 2: { name: 'entity.name.type.meem' } },
    });
  add('definition', { patterns: defRules });

  if (control.length) add('keyword-control', { name: 'keyword.control.meem', match: word(control) });
  if (declaration.length) add('keyword-declaration', { name: 'storage.type.meem', match: word(declaration) });
  if (logic.length) add('keyword-logic', { name: 'keyword.operator.word.meem', match: word(logic) });
  if (other.length) add('keyword-other', { name: 'keyword.other.meem', match: word(other) });
  if (constants.length) add('constant', { name: 'constant.language.meem', match: word(constants) });
  // دالة مدمجة حين يتبعها قوس (بعضها يشارك نوعاً في الاسم: عدد، كسر، نص).
  if (builtins.length)
    add('builtin', { name: 'support.function.builtin.meem', match: `${L}(?:${alt(builtins)})(?=\\s*\\()` });
  if (types.length) add('type', { name: 'support.type.meem', match: word(types) });
  add('number', { name: 'constant.numeric.meem', match: `${L}\\d+(?:\\.\\d+)?${R}|${L}\\d+(?:\\.\\d+)?(?=\\.\\.)` });
  add('call', { name: 'entity.name.function.call.meem', match: `${L}${ident}(?=\\()` });
  if (symbolOps.length) add('operator', { name: 'keyword.operator.meem', match: alt(symbolOps) });
  add('punctuation', { name: 'punctuation.meem', match: `[${lang.punctuation.map(esc).join('')}]` });

  return {
    name: 'meem',
    // «ميم» اسم اللغة في أسوار الكود: ```ميم
    aliases: ['ميم', 'م'],
    scopeName: 'source.meem',
    fileTypes: [lang.file_extension.replace(/^\./, '')],
    patterns,
    repository,
  };
}
