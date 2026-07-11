// =============================================================================
// seed-blog.mjs — starter News posts + wire News into the homepage & nav
// =============================================================================
// Idempotent and ADDITIVE (never removes existing content):
//   1. createOrReplace two starter posts (fixed ids) a volunteer can edit/delete.
//   2. Append a "Latest news" section to the home page IF one isn't there yet.
//   3. Append a "News" link to the main nav IF one isn't there yet.
// Re-running is safe. Run: node scripts/seed-blog.mjs
// =============================================================================
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { key, block, p, h2, strong, sh, pageId } from './pagebuilder-lib.mjs';

const SITE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const token = (readFileSync(`${SITE_DIR}/.dev.vars`, 'utf8').match(/SANITY_TOKEN="([^"]+)"/) ||
  [])[1];
if (!token) throw new Error('no SANITY_TOKEN in .dev.vars');

const client = createClient({
  projectId: 'niemhgev',
  dataset: 'production',
  apiVersion: '2025-01-01',
  token,
  useCdn: false,
});

const post = (id, { title, slug, publishedAt, category, excerpt, body }) => ({
  _id: id,
  _type: 'post',
  title,
  slug: { _type: 'slug', current: slug },
  publishedAt,
  category,
  excerpt,
  featured: false,
  body,
});

const posts = [
  post('post-welcome-new-website', {
    title: 'Welcome to our new website',
    slug: 'welcome-to-our-new-website',
    publishedAt: '2026-07-08T14:00:00Z',
    category: 'news',
    excerpt:
      'We have a fresh home online. Here is a quick tour of what is new and where to find things.',
    body: [
      p(
        'We are excited to share our newly rebuilt website. It is faster, easier to read on a phone, and simpler for our volunteer board to keep up to date.',
      ),
      h2('What you will find here'),
      p(
        'Class information, tuition, our co-op philosophy, a day in the life, and answers to the questions families ask most. This News page is where we will post announcements and updates through the year.',
      ),
      p(
        strong('Have a question? '),
        'Reach out any time through our contact page. We would love to show you around in person.',
      ),
    ],
  }),
  post('post-what-is-a-coop-preschool', {
    title: 'What makes a cooperative preschool different',
    slug: 'what-makes-a-cooperative-preschool-different',
    publishedAt: '2026-06-20T14:00:00Z',
    category: 'learning',
    excerpt:
      'A co-op is a preschool that families help run together. Here is what that means day to day, and why families love it.',
    body: [
      p(
        'At a cooperative preschool, families are part of the classroom, not just drop-off and pick-up. Parents take turns helping on class days, and everyone pitches in on the small jobs that keep the school running.',
      ),
      h2('Why families choose a co-op'),
      block(
        'You get to know the teachers, the other families, and your own child as a learner.',
        'normal',
      ),
      p(
        'It builds a real community. Children see their grown-ups invested in their school, and parents make friendships that last well past the preschool years.',
      ),
      p(
        strong('Curious whether it is right for your family? '),
        'The best way to know is to visit. Come see a class day and meet the teachers.',
      ),
    ],
  }),
];

// A "Latest news" section for the home page.
const newsSection = () => ({
  _type: 'latestPostsSection',
  _key: key(),
  header: sh('', 'Latest from WCP', 'News and updates from our preschool community.'),
  limit: 3,
  linkLabel: 'Read all news',
  background: 'grey',
  seam: true,
});

const newsNavLink = () => ({
  _type: 'navLink',
  _key: key(),
  label: 'News',
  linkType: 'url',
  url: '/news',
});

async function run() {
  // 1. Starter posts.
  const tx = client.transaction();
  for (const doc of posts) tx.createOrReplace(doc);
  await tx.commit();
  console.log(`seeded ${posts.length} starter posts`);

  // 2. Home page — append the news section if absent.
  const home = await client.getDocument(pageId('home'));
  if (home) {
    const sections = Array.isArray(home.sections) ? home.sections : [];
    if (!sections.some((s) => s._type === 'latestPostsSection')) {
      // Insert just before the final section (usually the closing CTA).
      const insertAt = Math.max(0, sections.length - 1);
      const next = [...sections];
      next.splice(insertAt, 0, newsSection());
      await client.patch(pageId('home')).set({ sections: next }).commit();
      console.log('added Latest news section to the home page');
    } else {
      console.log('home already has a Latest news section — left as is');
    }
  } else {
    console.log('no home page doc found — skipped homepage section');
  }

  // 3. Main nav — append a News link if absent.
  const nav = await client.getDocument('navigation');
  if (nav) {
    const mainNav = Array.isArray(nav.mainNav) ? nav.mainNav : [];
    const has = mainNav.some(
      (item) => item?.url === '/news' || (item?.label || '').toLowerCase() === 'news',
    );
    if (!has) {
      await client
        .patch('navigation')
        .set({ mainNav: [...mainNav, newsNavLink()] })
        .commit();
      console.log('added News to the main navigation');
    } else {
      console.log('nav already has a News link — left as is');
    }
  } else {
    console.log('no navigation doc found — skipped nav link');
  }
}

run().then(
  () => console.log('done'),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
