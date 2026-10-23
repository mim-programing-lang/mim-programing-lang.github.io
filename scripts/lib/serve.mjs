// خادم ثابت صغير لمجلد dist، للّقطات والفحوص. يُغلق بعد الاستعمال.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { root } from './meem.mjs';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
  '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.png': 'image/png', '.wasm': 'application/wasm',
};

export async function serveDist(port = 0) {
  const dist = path.join(root, 'dist');
  const server = http.createServer(async (req, res) => {
    try {
      let p = path.normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
      let file = path.join(dist, p);
      if (!file.startsWith(dist)) throw new Error('خارج dist');
      if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
      let body = await readFile(file);
      const type = TYPES[path.extname(file)] ?? 'application/octet-stream';
      const headers = { 'content-type': type };
      // كما تفعل منصة النشر: ضغط النصوص، وتخزين طويل لما في _headers.
      const accepts = String(req.headers['accept-encoding'] ?? '');
      if (/^(text|application\/(json|xml|javascript))|svg/.test(type)) {
        if (accepts.includes('br')) (body = brotliCompressSync(body)), (headers['content-encoding'] = 'br');
        else if (accepts.includes('gzip')) (body = gzipSync(body)), (headers['content-encoding'] = 'gzip');
      }
      if (/^\/(fonts|_astro)\//.test(p)) headers['cache-control'] = 'public, max-age=31536000, immutable';
      res.writeHead(200, headers);
      res.end(body);
    } catch {
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      res.end(await readFile(path.join(dist, '404.html')).catch(() => 'not found'));
    }
  });
  await new Promise((r) => server.listen(port, '127.0.0.1', r));
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((r) => server.close(r)) };
}
