/// <reference types="astro/client" />

// Set by src/middleware.ts on every /family-hub request: true only when the
// request carries the fingerprint-verified Studio preview cookie. Widgets read
// it to render `data-sanity` edit targets (src/lib/hub-preview.ts hubEditAttr)
// — never on a family's render.
declare namespace App {
  interface Locals {
    hubPreview?: boolean;
  }
}

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
  /** Long-lived Instagram Graph API token — build-time fetch of the "Life inside
   *  WCP" feed. Non-public (server/build only). Unset → the section shows its
   *  fallback album instead. See docs/PAGE_BUILDER.md. */
  readonly INSTAGRAM_TOKEN?: string;
  /** Cloudflare Web Analytics beacon token. Unset = no beacon (previews/dev). */
  readonly PUBLIC_CF_BEACON_TOKEN?: string;
  /** Turnstile site key — renders the anti-spam widget on the contact forms.
   *  Unset = dormant (the forms rely on the honeypot alone). docs/FORMS.md. */
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
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
    /** KV cache for the hub's slow external fetches (see src/lib/hub-cache.ts).
     *  Typed structurally (get/put only) to avoid pulling in the full
     *  @cloudflare/workers-types KVNamespace. Optional so a missing binding
     *  (e.g. a stripped-down preview) degrades to the in-isolate cache. */
    CACHE?: {
      get(key: string, type: 'text'): Promise<string | null>;
      put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
    };
    /** Shared password for the gated Family Hub (Cloudflare secret in prod). */
    FAMILY_HUB_PASSWORD: string;
    /** Sanity Editor token — server-only reads of the private (PII) dataset. */
    SANITY_TOKEN: string;
    /** Fourthwall Storefront API token (read-only catalog). Optional — the
     *  store card falls back to its Board-curated tiles when unset. */
    FOURTHWALL_STOREFRONT_TOKEN?: string;
    /** Fourthwall Open API basic-auth credentials (SUPER-ADMIN — server-only,
     *  never client). Optional — the "supporting our co-op" sales stat hides
     *  when unset. Only aggregate totals are ever read; no customer PII. */
    FOURTHWALL_API_USER?: string;
    FOURTHWALL_API_PASSWORD?: string;
    /** Resend API key for contact-form email. Optional — forms still store
     *  submissions in Sanity when unset. See docs/FORMS.md. */
    RESEND_API_KEY?: string;
    /** Where contact-form emails go (defaults to the site's general email). */
    CONTACT_TO?: string;
    /** Verified Resend "from" address (defaults to the Resend test sender). */
    CONTACT_FROM?: string;
    /** Turnstile server secret — when set, /api/contact rejects submissions
     *  whose widget token fails siteverify. Pair with PUBLIC_TURNSTILE_SITE_KEY. */
    TURNSTILE_SECRET_KEY?: string;
    /** AirNow (EPA) API key for the hub's air-quality chip. Optional, but
     *  STRONGLY preferred: unset, the chip falls back to Open-Meteo's forecast
     *  MODEL, which on 2026-07-19 read 61 against an observed 153 (Unhealthy).
     *  Free key: docs.airnowapi.org/account/request/. See hub-air-quality.ts. */
    AIRNOW_API_KEY?: string;
    /** Long-lived Instagram Graph API token, AS A WORKER SECRET — same value as
     *  the build-time INSTAGRAM_TOKEN env var, but set separately via
     *  `wrangler secret put INSTAGRAM_TOKEN` since SSR pages can't see
     *  import.meta.env. Read by SocialWallWidget.astro (hub home). Unset =
     *  the widget falls back to the Board-curated album. See docs/FAMILY_HUB.md. */
    INSTAGRAM_TOKEN?: string;
    /** Google Apps Script web-app URL — the free forms inbox that emails the
     *  board + logs to a Google Sheet. Unset = skip. See docs/FORMS.md. */
    FORMS_WEBHOOK_URL?: string;
    /** Shared secret sent with each webhook POST; must match the script's
     *  SHARED_TOKEN so strangers can't inject fake submissions. */
    FORMS_WEBHOOK_TOKEN?: string;
    /** Cloudflare API token with Account Analytics:Read, used ONLY by
     *  /api/stats to read this Worker's request counts for the Studio's
     *  "Site stats" tool. Worker secret (`wrangler secret put`). Unset = the
     *  tool shows its "not set up yet" card. Never logged. docs/SANITY.md. */
    CF_ANALYTICS_TOKEN?: string;
    /** Cloudflare account id. NOT a secret (it is in wrangler.jsonc vars);
     *  it only names which account the analytics query asks about. */
    CF_ACCOUNT_ID?: string;
    /** Newsletter provider: "buttondown" | "mailchimp". Unset = store-only. */
    NEWSLETTER_PROVIDER?: string;
    BUTTONDOWN_API_KEY?: string;
    MAILCHIMP_API_KEY?: string;
    MAILCHIMP_LIST_ID?: string;
    /** Mailchimp datacenter prefix, e.g. "us21" (the tail of your API key). */
    MAILCHIMP_SERVER_PREFIX?: string;
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
