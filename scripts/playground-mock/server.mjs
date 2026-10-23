// ⚠ خادم وهمي للتطوير والاختبار فقط. لا يشغّل المجمّع، ولا يدخل في البناء (dist/)، ولا يُنشر أبداً.
// يحاكي عقد docs/playground-api.md ليُختبر به الملعب: الحالة يختارها سطر «# mock:...» في الشيفرة.
//   (بلا علامة)        مثال من الكتاب: مخرجه المتوقع؛ وغيره: نجاح بمخرج ثابت
//   # mock:compile     خطأ ترجمة (2)          # mock:runtime   خطأ تشغيل (3)
//   # mock:timeout     تجاوز الزمن             # mock:truncate  خرج مقطوع عند 64 ك.ب
//   # mock:xss         خرج فيه وسوم HTML       # mock:500       رد 500
//   # mock:reset       يقطع الاتصال            # mock:hang      لا يرد
// GET /count عدد طلبات التشغيل التي وصلت (للاختبار: أن الرابط المشارك لا يشغّل تلقائياً).
import http from 'node:http';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const port = Number(process.env.MOCK_PORT ?? 8788);
const here = path.dirname(new URL(import.meta.url).pathname);
const examples = JSON.parse(readFileSync(path.join(here, '../../src/generated/playground.json'), 'utf8')).examples;
let count = 0;

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' };
const reply = (res, body, status = 200) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...cors });
  res.end(JSON.stringify(body));
};

http
  .createServer((req, res) => {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, cors);
      return res.end();
    }
    if (req.method === 'GET' && req.url === '/count') return reply(res, { count });
    if (req.method !== 'POST') return reply(res, { error: 'method' }, 405);
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      count++;
      let code = '';
      try {
        code = String(JSON.parse(body).code ?? '');
      } catch {
        return reply(res, { error: 'json' }, 400);
      }
      const mark = /#\s*mock:(\w+)/.exec(code)?.[1];
      const base = { duration_ms: 42, truncated: false, status: 'ran' };
      switch (mark) {
        case 'compile':
          return reply(res, { ...base, stdout: '', stderr: '[خطأ نحوي] سطر 1:9 - انتهى السطر بشكل مفاجئ: متوقع \':\'\n', exit_code: 2 });
        case 'runtime':
          return reply(res, { ...base, stdout: 'قبل\n', stderr: '[خطأ تشغيل] سطر 2:7 - الفهرس 5 خارج الحدود (الحجم 2)\n', exit_code: 3 });
        case 'timeout':
          return reply(res, { ...base, status: 'timeout', stdout: 'بدأ\n', stderr: '', exit_code: 137, truncated: true, duration_ms: 8003, reason: 'تجاوز البرنامج 8 ثوانٍ' });
        case 'truncate':
          return reply(res, { ...base, status: 'output_limit', stdout: 'ا'.repeat(32768), stderr: '', exit_code: null, truncated: true });
        case 'xss':
          return reply(res, {
            ...base,
            stdout: '<script>window.__xss = 1</script><img src=x onerror="window.__xss = 2">\n',
            stderr: '<img src=y onerror="window.__xss = 3"><b>عريض</b>\n',
            exit_code: 0,
          });
        case '500':
          return reply(res, { error: 'server' }, 500);
        case 'reset':
          return req.socket.destroy();
        case 'hang':
          return; // لا رد: مهلة الصفحة تتصرف
        default: {
          const ex = examples.find((e) => e.code === code);
          if (ex) return reply(res, { ...base, stdout: ex.stdout, stderr: ex.stderr, exit_code: ex.exit });
          return reply(res, { ...base, stdout: 'تشغيل وهمي\n', stderr: '', exit_code: 0 });
        }
      }
    });
  })
  .listen(port, '127.0.0.1', () => console.log(`[mock] خادم وهمي للاختبار على http://127.0.0.1:${port}/run`));
