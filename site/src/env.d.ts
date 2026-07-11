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

// =============================================================================
// Cloudflare runtime — server-only secrets & bindings
// =============================================================================
// Astro 6+ removed `Astro.locals.runtime.env`. Server code now reads Worker
// secrets/bindings via `import { env } from 'cloudflare:workers'`, whose value
// is typed by the global `Cloudflare.Env` interface (interfaces merge, so this
// augments whatever `wrangler types` generates). Sessions use the "SESSION" KV
// binding automatically; we only type the secrets/bindings we touch directly.
declare namespace Cloudflare {
  interface Env {
    /** Shared password for the gated Family Hub (Cloudflare secret in prod). */
    FAMILY_HUB_PASSWORD: string;
    /** Sanity Editor token — server-only reads of the private (PII) dataset. */
    SANITY_TOKEN: string;
  }
}

// The `cloudflare:workers` virtual module is provided by workerd at runtime and
// bundled by the adapter at build time; TypeScript still needs this ambient
// declaration to resolve the `import { env } from 'cloudflare:workers'` we use
// for server secrets. We only consume `env`, typed as our Cloudflare.Env above.
// (If `wrangler types` is ever adopted, drop this in favor of the generated
// worker-configuration.d.ts.)
declare module 'cloudflare:workers' {
  export const env: Cloudflare.Env;
}
