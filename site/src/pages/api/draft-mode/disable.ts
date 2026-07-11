import type { APIRoute } from 'astro';
import { perspectiveCookieName } from '@sanity/preview-url-secret/constants';

export const prerender = false;

// presentationTool's `previewMode.disable` option is a documented no-op in the
// installed Sanity version ("this API is not yet implemented"), so this route
// isn't wired through that config — it's hit directly by the "Exit preview"
// link PreviewLayout renders while draft mode is on.
export const GET: APIRoute = async (context) => {
  context.cookies.delete(perspectiveCookieName, { path: '/' });
  return context.redirect('/preview');
};
