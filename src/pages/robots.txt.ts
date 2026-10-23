// robots.txt مولَّد من عنوان الموقع (site في astro.config.mjs، أي SITE_URL)، فيشير إلى خريطة الموقع على النطاق نفسه.
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap-index.xml', site).href}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
