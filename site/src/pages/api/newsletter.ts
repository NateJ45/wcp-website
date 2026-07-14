// =============================================================================
// GET /api/newsletter — the newsletter "send" feed (token-protected)
// =============================================================================
// Consumed by an Apps Script sendNewsletter() function (see docs/FORMS.md): the
// board runs it (or a trigger fires) to email the subscriber list a short teaser
// linking to the issue's public page. Sending from Apps Script, not a Worker, is
// deliberate — Workers can't send email on the free tier, and the Google side
// already holds the mailer, the token, and the recipient list.
//
// Returns the latest published issue (or ?slug= for a specific one) as a compact
// teaser: subject, preheader, the public URL, and a cover image URL. Requires
// ?token= to match FORMS_WEBHOOK_TOKEN, and 404s when the token is unset
// (feature off) — same gate as /api/digest.
// =============================================================================
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { sanityFetch } from '@/lib/sanity';
import { NEWSLETTER_LATEST_QUERY, NEWSLETTER_BY_SLUG_QUERY } from '@/lib/queries';
import { imageUrl, type SanityImageSource, type SanityImageValue } from '@/lib/image';

const SITE = 'https://www.westchesterpreschool.org';

interface IssueDoc {
  title?: string;
  slug?: string;
  preheader?: string;
  publishedAt?: string;
  coverImage?: SanityImageValue | null;
}

export const GET: APIRoute = async (context) => {
  const secret = env.FORMS_WEBHOOK_TOKEN;
  const given = context.url.searchParams.get('token') ?? '';
  if (!secret || given !== secret) {
    return new Response('Not found', { status: 404 });
  }

  const slug = context.url.searchParams.get('slug');
  let issue: IssueDoc | null = null;
  try {
    issue = slug
      ? await sanityFetch<IssueDoc | null>(NEWSLETTER_BY_SLUG_QUERY, { slug })
      : await sanityFetch<IssueDoc | null>(NEWSLETTER_LATEST_QUERY);
  } catch (err) {
    console.error('[newsletter] fetch failed', err);
    return new Response('Error', { status: 500 });
  }

  if (!issue?.slug) {
    // No issue to send yet — a well-formed "nothing to send" the mailer can skip.
    return new Response(JSON.stringify({ issue: null }), {
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    });
  }

  const coverImageUrl = issue.coverImage?.asset
    ? imageUrl(issue.coverImage as SanityImageSource, 1200)
    : '';

  return new Response(
    JSON.stringify({
      issue: {
        subject: issue.title ?? 'West Chester Preschool Newsletter',
        preheader: issue.preheader ?? '',
        url: `${SITE}/newsletter/${issue.slug}`,
        coverImageUrl,
        publishedAt: issue.publishedAt ?? '',
      },
    }),
    { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } },
  );
};
