// =============================================================================
// Embed helpers — YouTube/Vimeo + Google Maps
// =============================================================================
// Used by the click-to-load Video and Map sections. Nothing here loads a
// third-party iframe by itself; the renderers only insert the embed URL after
// the visitor clicks, so no Google/YouTube request (or cookie) happens on a
// normal page view.
// =============================================================================

export interface ParsedVideo {
  provider: 'youtube' | 'vimeo' | null;
  embedUrl: string | null;
  /** A poster image URL when the provider exposes one (YouTube); else null. */
  thumbnailUrl: string | null;
}

/** Turn a YouTube/Vimeo watch link into a privacy-friendly embed + thumbnail. */
export function parseVideo(url: string | undefined): ParsedVideo {
  const none: ParsedVideo = { provider: null, embedUrl: null, thumbnailUrl: null };
  if (!url) return none;

  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) {
    const id = yt[1];
    return {
      provider: 'youtube',
      // -nocookie host = no tracking cookie until playback.
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`,
      thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  }

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) {
    return {
      provider: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`,
      thumbnailUrl: null,
    };
  }

  return none;
}

/** Google Maps embed URL for an address (no API key needed). */
export function mapEmbedUrl(address: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}

/** Google Maps "get directions to" URL for an address. */
export function mapDirectionsUrl(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}
