/// <reference types="astro/client" />

// =============================================================================
// Environment variable types
// =============================================================================
// Typing import.meta.env gives editor autocomplete + a compile error if a var
// is referenced but not declared. PUBLIC_ vars are inlined into client HTML at
// build time (safe for IDs meant to be public, like the Google tag). Anything
// secret (Sanity read token, session secret) will be a NON-public var read
// only on the server — those get added here (without the PUBLIC_ prefix) when
// the Family Hub and Sanity land.
// =============================================================================
interface ImportMetaEnv {
  /** Google Ads conversion tag id, e.g. "AW-16817798038". Empty disables it. */
  readonly PUBLIC_GADS_ID?: string;
  /** Search-console / Bing site-verification token for the <meta> tag. */
  readonly PUBLIC_GSC_VERIFICATION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
