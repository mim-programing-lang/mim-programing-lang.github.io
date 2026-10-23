import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { existsSync } from 'node:fs';
import { SITE_URL, site } from './site.config.mjs';
import { sidebar } from './src/nav.mjs';

const logo = './brand/language-logo.svg';
const hasLogo = existsSync(new URL(logo, import.meta.url));

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  integrations: [
    starlight({
      title: site.name,
      description: site.tagline,
      // العربية هي الجذر. لإضافة الإنجليزية لاحقاً: أضف en هنا وضع الصفحات في src/content/docs/en/.
      defaultLocale: 'root',
      locales: {
        root: { label: 'العربية', lang: 'ar', dir: 'rtl' },
      },
      ...(hasLogo ? { logo: { src: logo, alt: `شعار ${site.name}` } } : {}),
      favicon: '/favicon.svg',
      customCss: ['./src/styles/fonts.css', './src/styles/tokens.css', './src/styles/site.css'],
      head: [
        // الخطوط الثلاثة تظهر في أول الشاشة (نص عربي، لاتيني، كود): تُحمَّل مبكراً فلا يتبدل الخط بعد الرسم.
        ...['noto-sans-arabic', 'noto-sans', 'cairo'].map((f) => ({
          tag: 'link',
          attrs: { rel: 'preload', href: `/fonts/${f}.woff2`, as: 'font', type: 'font/woff2', crossorigin: '' },
        })),
      ],
      components: {
        PageTitle: './src/components/PageTitle.astro',
        SocialIcons: './src/components/SocialIcons.astro',
        Sidebar: './src/components/Sidebar.astro',
        Footer: './src/components/Footer.astro',
      },
      routeMiddleware: './src/routeData.ts',
      credits: false,
      lastUpdated: false,
      sidebar,
    }),
  ],
});
