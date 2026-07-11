import type { APIRoute } from 'astro';
import { validatePreviewUrl } from '@sanity/preview-url-secret';
import { perspectiveCookieName } from '@sanity/preview-url-secret/constants';
import { getPreviewClient } from '@/lib/cms-preview';

export const prerender = false;

// Called by the Presentation Tool's Preview iframe (never by a visitor) to turn
// on draft mode. Validates the one-time secret Sanity attaches to the preview
// URL, then sets the perspective cookie every preview page checks.
export const GET: APIRoute = async (context) => {
  const client = getPreviewClient(true);
  const { isValid, redirectTo } = await validatePreviewUrl(client, context.request.url);

  if (!isValid) {
    return new Response('Invalid preview secret', { status: 401 });
  }

  // sameSite: 'none' + secure: true — required because the Presentation Tool
  // loads this page inside a cross-context iframe; a Lax/Strict cookie would
  // silently fail to stick.
  context.cookies.set(perspectiveCookieName, 'true', {
    path: '/',
    httpOnly: true,
    sameSite: 'none',
    secure: true,
  });

  return context.redirect(redirectTo || '/preview');
};
