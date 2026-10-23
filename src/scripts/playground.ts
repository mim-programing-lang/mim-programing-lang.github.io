// واجهة الملعب في المتصفح. لا innerHTML مع أي نص من الزائر أو الخادم: كل عرض بـ textContent.
// لا تشغيل تلقائي أبداً: لا عند فتح رابط مشاركة، ولا عند اختيار مثال. لا تخزين، ولا طلب إلا إلى عنوان الخادم.
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history as editHistory, historyKeymap } from '@codemirror/commands';
import { StreamLanguage, HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import pg from '../generated/playground.json';

type Example = { id: string; title: string; code: string; stdout: string; stderr: string; exit: number };
type Reply = { stdout?: unknown; stderr?: unknown; exit_code?: unknown; duration_ms?: unknown; truncated?: unknown; status?: unknown; reason?: unknown };

const root = document.querySelector<HTMLElement>('.pg');
if (root) init(root);

function init(root: HTMLElement) {
  const api = root.dataset.api ?? '';
  const timeoutMs = Number(root.dataset.timeoutMs ?? 15000);
  const minIntervalMs = Number(root.dataset.minIntervalMs ?? 3000);
  const maxShareBytes = Number(root.dataset.maxShareBytes ?? 16384);
  const maxCodeBytes = Number(root.dataset.maxCodeBytes ?? 65536);
  const maxBodyBytes = Number(root.dataset.maxBodyBytes ?? 98304);
  const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const state = $('pg-state');
  const fromLink = $('pg-from-link');
  const select = $<HTMLSelectElement>('pg-examples');
  const runBtn = $<HTMLButtonElement>('pg-run');
  const shareBtn = $<HTMLButtonElement>('pg-share');
  const shareMsg = $('pg-share-msg');
  const out = $('pg-stdout');
  const err = $('pg-stderr');
  const exitEl = $('pg-exit');
  const duration = $('pg-duration');
  const expected = $<HTMLDetailsElement>('pg-expected');
  const examples = new Map((pg.examples as Example[]).map((e) => [e.id, e]));

  const view = new EditorView({
    parent: $('pg-editor'),
    state: EditorState.create({
      doc: '',
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        editHistory(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        meemLanguage(pg.words),
        syntaxHighlighting(meemHighlight),
        EditorView.contentAttributes.of({ dir: 'rtl', 'aria-label': 'شيفرة ميم' }),
        EditorView.lineWrapping,
      ],
    }),
  });
  const setCode = (code: string) => view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: code } });
  const show = (el: HTMLElement, text: string) => {
    el.textContent = clean(text);
  };

  // اختيار مثال: يحمّله ويعرض مخرجه المتوقع، بلا تشغيل.
  const loadExample = (id: string) => {
    const ex = examples.get(id);
    if (!ex) return false;
    setCode(ex.code);
    select.value = id;
    show($('pg-exp-stdout'), ex.stdout);
    show($('pg-exp-stderr'), ex.stderr);
    $('pg-exp-exit').textContent = String(ex.exit);
    expected.hidden = false;
    return true;
  };
  select.addEventListener('change', () => {
    fromLink.hidden = true;
    if (!loadExample(select.value)) expected.hidden = true;
  });

  // الرابط: #ex=<معرّف مثال> أو #code=<شيفرة مضغوطة>. لا تشغيل تلقائي.
  readFragment().then((r) => {
    if (r.kind === 'example') {
      if (!loadExample(r.id)) setState('هذا المثال غير متاح في الملعب.');
    } else if (r.kind === 'code') {
      setCode(r.code);
      fromLink.hidden = false;
    } else if (r.kind === 'invalid') {
      setState(r.message);
    }
  });

  // التشغيل
  let busy = false;
  let lastRun = 0;
  const setState = (text: string) => {
    state.textContent = text;
  };
  runBtn.addEventListener('click', async () => {
    if (!api || busy) return;
    const wait = lastRun + minIntervalMs - Date.now();
    if (wait > 0) {
      setState(`انتظر ${Math.ceil(wait / 1000)} ث قبل تشغيل آخر.`);
      return;
    }
    // حدود العقد: الشيفرة حتى 64 ك.ب، وجسم الطلب حتى 96 ك.ب. ما زاد لا يُرسل.
    const code = view.state.doc.toString();
    const body = JSON.stringify({ code });
    const enc = new TextEncoder();
    if (enc.encode(code).length > maxCodeBytes || enc.encode(body).length > maxBodyBytes) {
      setState(`الشيفرة أكبر من حد الملعب (${Math.round(maxCodeBytes / 1024)} ك.ب).`);
      return;
    }
    busy = true;
    lastRun = Date.now();
    runBtn.disabled = true;
    setState('قيد التشغيل…');
    show(out, '');
    show(err, '');
    exitEl.textContent = '—';
    duration.textContent = '';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: controller.signal,
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const r = (await res.json()) as Reply;
      show(out, typeof r.stdout === 'string' ? r.stdout : '');
      show(err, typeof r.stderr === 'string' ? r.stderr : typeof r.reason === 'string' ? r.reason : '');
      exitEl.textContent = typeof r.exit_code === 'number' ? String(r.exit_code) : '—';
      if (typeof r.duration_ms === 'number') duration.textContent = `· ${Math.round(r.duration_ms)} م.ث`;
      if (r.status === 'timeout') setState('تجاوز الزمن: أُوقف البرنامج عند الحد (8 ثوانٍ).');
      else if (r.status === 'rejected') setState('رُفض البرنامج قبل التشغيل.');
      else if (r.truncated === true || r.status === 'output_limit') setState('انتهى، والمخرج مقطوع عند 64 ك.ب.');
      else setState('انتهى.');
    } catch (e) {
      const aborted = (e as Error).name === 'AbortError';
      setState(aborted ? 'الملعب غير متاح: لم يرد الخادم في المهلة.' : 'الملعب غير متاح: تعذّر الاتصال بالخادم.');
    } finally {
      clearTimeout(timer);
      busy = false;
      // يبقى الزر معطلاً حتى تنقضي المدة الدنيا بين تشغيلين.
      setTimeout(() => {
        runBtn.disabled = !api;
      }, Math.max(0, lastRun + minIntervalMs - Date.now()));
    }
  });

  // المشاركة: الشيفرة مضغوطة في جزء الرابط بعد # (لا تصل إلى أي خادم).
  shareBtn.addEventListener('click', async () => {
    const encoded = await compress(view.state.doc.toString());
    if (encoded.length > maxShareBytes) {
      shareMsg.textContent = `الشيفرة أطول من حد المشاركة (${maxShareBytes} بايت بعد الضغط).`;
      return;
    }
    const url = `${location.origin}${location.pathname}#code=${encoded}`;
    window.history.replaceState(null, '', `#code=${encoded}`);
    try {
      await navigator.clipboard.writeText(url);
      shareMsg.textContent = 'نُسخ الرابط.';
    } catch {
      shareMsg.textContent = 'الرابط في شريط العنوان: انسخه من هناك.';
    }
  });

  async function readFragment(): Promise<{ kind: 'none' } | { kind: 'example'; id: string } | { kind: 'code'; code: string } | { kind: 'invalid'; message: string }> {
    const hash = location.hash.slice(1);
    if (hash.startsWith('ex=')) return { kind: 'example', id: decodeURIComponent(hash.slice(3)) };
    if (!hash.startsWith('code=')) return { kind: 'none' };
    const data = hash.slice(5);
    if (data.length > maxShareBytes) return { kind: 'invalid', message: 'رابط المشاركة أطول من الحد المسموح.' };
    try {
      return { kind: 'code', code: await decompress(data, 64 * 1024) };
    } catch {
      return { kind: 'invalid', message: 'رابط المشاركة تالف.' };
    }
  }
}

/** يُسقط رموز التحكم (ومنها تسلسلات ANSI) عدا السطر الجديد والجدولة، قبل العرض. */
function clean(s: string): string {
  return s.replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, '').replace(/[\x00-\x08\x0b-\x1f\x7f]/g, '');
}

async function compress(text: string): Promise<string> {
  const stream = new Blob([new TextEncoder().encode(text)]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function decompress(data: string, maxBytes: number): Promise<string> {
  const bin = atob(data.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  const reader = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
  const parts: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > maxBytes) throw new Error('too large');
    parts.push(value);
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(await new Blob(parts).arrayBuffer()));
}

/** تلوين ميم في المحرر، من كلمات وصف اللغة نفسه الذي يلوّن كتل الشيفرة. */
function meemLanguage(words: { keywords: string[]; types: string[]; builtins: string[]; constants: string[] }) {
  const kw = new Set(words.keywords);
  const ty = new Set(words.types);
  const bi = new Set(words.builtins);
  const co = new Set(words.constants);
  const stop = /[\s!"#$%&'()*+,\-./:;<=>?@[\\\]^{|}~،؛؟]/;
  return StreamLanguage.define({
    token(stream) {
      if (stream.eatSpace()) return null;
      const ch = stream.peek() ?? '';
      if (ch === '#') {
        stream.skipToEnd();
        return 'comment';
      }
      if (ch === '"' || ch === "'") {
        stream.next();
        let escaped = false;
        while (!stream.eol()) {
          const c = stream.next();
          if (c === ch && !escaped) break;
          escaped = c === '\\' && !escaped;
        }
        return 'string';
      }
      if (/\d/.test(ch)) {
        stream.match(/^\d+(\.\d+)?/);
        return 'number';
      }
      if (stop.test(ch)) {
        stream.next();
        return /[+\-*/%=<>!&|^~]/.test(ch) ? 'operator' : null;
      }
      let w = '';
      while (!stream.eol() && !stop.test(stream.peek() ?? ' ')) w += stream.next();
      if (kw.has(w)) return 'keyword';
      if (co.has(w)) return 'atom';
      if (ty.has(w)) return 'typeName';
      if (bi.has(w)) return 'builtin';
      return 'variableName';
    },
  });
}

const meemHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: 'var(--pg-kw, #d8271c)' },
  { tag: tags.comment, color: 'var(--sl-color-gray-3)', fontStyle: 'italic' },
  { tag: tags.string, color: 'var(--pg-str, #2f7d32)' },
  { tag: tags.number, color: 'var(--pg-num, #1565c0)' },
  { tag: tags.atom, color: 'var(--pg-num, #1565c0)' },
  { tag: tags.typeName, color: 'var(--pg-type, #8e44ad)' },
  { tag: [tags.standard(tags.variableName)], color: 'var(--pg-builtin, #b26a00)' },
  { tag: tags.operator, color: 'var(--pg-kw, #d8271c)' },
]);
