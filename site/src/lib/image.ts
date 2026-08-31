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

/**
 * The intrinsic size a Sanity asset ref bakes into its id
 * ("image-<hash>-844x1267-jpg"), or null when the shape is unrecognized.
 * Lets a component pick a frame that MATCHES the photo's orientation instead
 * of forcing every photo through one aspect — a portrait headshot in a 4/3
 * landscape slot loses half its height to object-cover (it cut a teacher's
 * face off at the eyes, found live 2026-09-01).
 */
export function imageDimensions(
  source: SanityImageSource | SanityImageValue | undefined | null,
): { width: number; height: number } | null {
  const asset =
    source && typeof source === 'object' ? (source as SanityImageValue).asset : undefined;
  const ref =
    typeof source === 'string'
      ? source
      : asset && typeof asset === 'object'
        ? ((asset as { _ref?: string; _id?: string })._ref ??
          (asset as { _ref?: string; _id?: string })._id)
        : undefined;
  const m = typeof ref === 'string' ? ref.match(/-(\d+)x(\d+)-/) : null;
  return m ? { width: Number(m[1]), height: Number(m[2]) } : null;
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

/**
 * A download URL for a Sanity FILE asset, straight from its reference.
 * A ref reads `file-<hash>-<ext>`; the CDN serves it at
 * https://cdn.sanity.io/files/<projectId>/<dataset>/<hash>.<ext>.
 * Built from the ref so portable-text bodies need no GROQ dereference.
 * Returns null for anything that is not a file ref.
 */
export function fileUrlFromRef(ref: string | undefined | null): string | null {
  const m = /^file-([A-Za-z0-9]+)-([a-z0-9]+)$/.exec(ref ?? '');
  if (!m) return null;
  return `https://cdn.sanity.io/files/${projectId}/${dataset}/${m[1]}.${m[2]}`;
}
