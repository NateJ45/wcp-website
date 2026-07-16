// =============================================================================
// Instagram feed — fetch of the "Life inside WCP" gallery
// =============================================================================
// Shared by two call sites with two different token sources, which is why the
// token is a parameter rather than read internally:
//   - Public site (static): InstagramSection.astro calls this at BUILD time,
//     token from the build-time INSTAGRAM_TOKEN env var (import.meta.env).
//   - Family Hub (SSR): SocialWallWidget.astro calls this at REQUEST time,
//     token from the INSTAGRAM_TOKEN Worker secret (`cloudflare:workers` env),
//     wrapped in src/lib/hub-cache.ts so a visitor never waits on Instagram.
// No token, a failed request, or an empty feed all return [] so each caller
// falls back to its curated album. Nothing hits Instagram from a visitor's
// browser either way — both fetches are server-only.
// =============================================================================

export interface InstaTile {
  imgUrl: string;
  href: string;
  alt: string;
}

interface IgMediaItem {
  id: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  caption?: string;
}

/** Recent Instagram media as ready-to-render tiles. [] when unavailable.
 *  `token` defaults to the build-time env var for the public call site; the
 *  hub call site passes its Worker-secret token explicitly. */
export async function fetchInstagram(
  limit = 12,
  token = import.meta.env.INSTAGRAM_TOKEN,
): Promise<InstaTile[]> {
  if (!token) return [];
  try {
    const fields = 'id,media_type,media_url,thumbnail_url,permalink,caption';
    const url = `https://graph.instagram.com/me/media?fields=${fields}&limit=${limit}&access_token=${token}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = (await res.json()) as { data?: IgMediaItem[] };
    const items = Array.isArray(data.data) ? data.data : [];
    return items
      .map((m) => {
        const imgUrl = m.media_type === 'VIDEO' ? (m.thumbnail_url ?? m.media_url) : m.media_url;
        if (!imgUrl) return null;
        const caption = (m.caption ?? '').replace(/\s+/g, ' ').trim();
        return {
          imgUrl,
          href: m.permalink ?? 'https://www.instagram.com/westchesterpreschool',
          alt: caption
            ? caption.slice(0, 120)
            : 'A moment from West Chester Preschool on Instagram',
        };
      })
      .filter((t): t is InstaTile => t !== null)
      .slice(0, limit);
  } catch {
    return [];
  }
}
