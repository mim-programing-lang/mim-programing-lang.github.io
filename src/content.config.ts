import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
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
