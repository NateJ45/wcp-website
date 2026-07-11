// =============================================================================
// Sanity image URLs
// =============================================================================
// The page builder's images are uploaded to Sanity (not local src/assets), so
// they're served responsively from Sanity's CDN via @sanity/image-url instead
// of Astro's build-time Sharp pipeline. `imageService:'compile'` in the Astro
// config only touches local <Image> imports, so this path is independent.
// =============================================================================
import imageUrlBuilder from '@sanity/image-url';
import { projectId, dataset } from '@/sanity/env';

const builder = imageUrlBuilder({ projectId, dataset });

/** The image-source shape @sanity/image-url accepts (Sanity image object / ref). */
export type SanityImageSource = Parameters<typeof builder.image>[0];

/**
 * A Sanity image FIELD value as returned by GROQ — an object with an `asset`
 * plus our schema's `alt`/`caption`. Distinct from SanityImageSource (a broad
 * union that also allows bare strings/refs), so callers can test `.asset` and
 * read `.alt` without narrowing. Cast to SanityImageSource at the builder call.
 */
export interface SanityImageValue {
  asset?: unknown;
  alt?: string;
  caption?: string;
  [key: string]: unknown;
}

/** A URL builder for a Sanity image (chain .width(), .height(), etc.). */
export function urlForImage(source: SanityImageSource) {
  return builder.image(source).auto('format').fit('max');
}

/** A single, sensibly-sized URL for a Sanity image. */
export function imageUrl(source: SanityImageSource, width = 1200): string {
  return urlForImage(source).width(width).url();
}

/** A `srcset` string across common widths, for responsive <img srcset>. */
export function imageSrcSet(
  source: SanityImageSource,
  widths: number[] = [400, 640, 960, 1280, 1920],
): string {
  return widths.map((w) => `${urlForImage(source).width(w).url()} ${w}w`).join(', ');
}
