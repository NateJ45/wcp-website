// =============================================================================
// Instagram feed — build-time fetch of the "Life inside WCP" gallery
// =============================================================================
// The public site is static, so we pull recent Instagram media once at BUILD
// time (server-only) with a long-lived Graph API token in INSTAGRAM_TOKEN. No
// token, a failed request, or an empty feed all return [] so the section falls
// back to its curated album. Nothing hits Instagram from a visitor's browser.
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

/** Recent Instagram media as ready-to-render tiles. [] when unavailable. */
export async function fetchInstagram(limit = 12): Promise<InstaTile[]> {
  const token = import.meta.env.INSTAGRAM_TOKEN;
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
