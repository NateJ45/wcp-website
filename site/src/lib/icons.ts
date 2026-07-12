// =============================================================================
// Icon-name guards
// =============================================================================
// <Icon> throws on an unknown name (on purpose, to catch typos in code). When an
// icon name comes from Sanity — where a volunteer could mistype it — pass it
// through `safeIcon` first so a bad value falls back instead of 500-ing the page.
// =============================================================================
import { lucideIcons } from '@/lib/lucide-icons';
import { brandIcons } from '@/lib/brand-icons';

/** True if `name` is a known icon and therefore safe to pass to <Icon>. */
export const hasIcon = (name?: string | null): boolean =>
  !!name && (name in lucideIcons || name in brandIcons);

/** `name` if it is a known icon, otherwise `fallback`. */
export const safeIcon = (name: string | null | undefined, fallback: string): string =>
  hasIcon(name) ? (name as string) : fallback;
