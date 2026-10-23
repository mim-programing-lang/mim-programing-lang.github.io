// شريط جانبي مستقل لكل قسم: من الشريط الكامل تبقى مجموعة القسم الذي فيه الصفحة،
// والسابق/التالي لا يعبران من قسم إلى آخر.
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

type Entry = { type: string; href?: string; isCurrent?: boolean; entries?: Entry[] };

const links = (entries: Entry[]): Entry[] => entries.flatMap((e) => (e.type === 'group' ? links(e.entries ?? []) : [e]));

export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;
  const top = route.sidebar as Entry[];
  const section = top.find((g) => g.type === 'group' && links(g.entries ?? []).some((l) => l.isCurrent));
  if (!section) return;
  const inSection = new Set(links(section.entries ?? []).map((l) => l.href));
  route.sidebar = section.entries as typeof route.sidebar;
  if (route.pagination.prev && !inSection.has(route.pagination.prev.href)) route.pagination.prev = undefined;
  if (route.pagination.next && !inSection.has(route.pagination.next.href)) route.pagination.next = undefined;
});
