import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';

export const collections = {
  // نصوص واجهة البحث بالعربية: ترجمة Starlight العربية بلا نصوص Pagefind («Clear» وغيره).
  i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        // كلمات بحث للصفحة: جموع ومرادفات لا يوحّدها فهرس البحث وحده (قائمة/قوائم). انظر src/lib/search-keywords.mjs.
        keywords: z.array(z.string()).optional(),
      }),
    }),
  }),
};
