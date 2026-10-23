// حارس الصيغ الممنوعة في أمثلة الموقع بقرار اللغة، وإن كان المجمّع المستعمل ما زال يقبلها.
// اليوم: عامل الدمج «..» (يُلغى من اللغة). يُبحث عنه خارج النصوص والتعليقات؛ حدودها من وصف اللغة الذي يطبعه المجمّع.

/** يرجع أرقام الأسطر (من 1) التي فيها «..» خارج نص أو تعليق. */
export function findConcat(code, language) {
  const { quote, char_quote } = language.string;
  const comment = language.comment;
  const hits = [];
  code.split('\n').forEach((line, n) => {
    let inside = null;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inside) {
        if (ch === '\\') i++;
        else if (ch === inside) inside = null;
      } else if (ch === quote || ch === char_quote) inside = ch;
      else if (line.startsWith(comment, i)) break;
      else if (ch === '.' && line[i + 1] === '.') {
        hits.push(n + 1);
        break;
      }
    }
  });
  return hits;
}
