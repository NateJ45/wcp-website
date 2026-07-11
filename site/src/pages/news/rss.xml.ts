// =============================================================================
// /news/rss.xml — RSS feed of News posts
// =============================================================================
// Static (prerendered) feed so readers and aggregators can subscribe to the
// News. Rebuilt with the site on every publish.
// =============================================================================
export const prerender = true;

import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { cmsFetch } from '@/lib/cms';
import { POSTS_QUERY } from '@/lib/queries';
import type { PostSummary } from '@/components/PostCard.astro';
import { site } from '@/data/site';

export async function GET(context: APIContext) {
  const posts = await cmsFetch<PostSummary[]>(POSTS_QUERY, {}, []);
  return rss({
    title: `${site.name} — News`,
    description: 'Announcements, updates, and stories from West Chester Preschool.',
    site: context.site ?? site.url,
    items: posts.map((p) => ({
      title: p.title ?? '',
      description: p.excerpt ?? '',
      pubDate: p.publishedAt ? new Date(p.publishedAt) : undefined,
      link: `/news/${p.slug}`,
      categories: p.category ? [p.category] : undefined,
    })),
    customData: `<language>en-us</language>`,
  });
}
