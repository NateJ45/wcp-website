import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = (context) => {
  // Clear the whole session so the family flag is gone.
  context.session?.destroy();
  return context.redirect('/family-hub/login');
};
