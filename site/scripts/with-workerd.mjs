// PORTABLE: canonical copy - ncs-astro-sanity-starter is the library of record for this file
// =============================================================================
// with-workerd.mjs — run a command with a workerd that actually starts
// =============================================================================
// NOT WIRED IN THIS REPO (2026-08-27). It is here, unused, on purpose.
//
// `npm run build` on this repo boots the Cloudflare runtime through
// @cloudflare/vite-plugin and works today on Windows, so nothing calls this
// wrapper. It ARMS the day the failure below appears — most likely at an
// @astrojs/cloudflare / vite-plugin upgrade that changes the pinned workerd
// binary. To arm it, change the build script to:
//     "build": "node scripts/with-workerd.mjs astro build"
// and say so in site/docs/TESTING.md.
//
// WHY IT EXISTS (learned on the presacademy repo, 2026-08-25/26)
//
// `astro build` prerenders the static pages by booting the Cloudflare runtime
// (workerd). On Windows, some versions of the workerd the plugin pins (hoisted
// to node_modules/@cloudflare/workerd-windows-64) abort immediately:
//
//     *** std::terminate() called with no exception
//     MiniflareCoreError [ERR_RUNTIME_FAILURE]: The Workers runtime failed to start.
//
// The NEWER workerd that ships inside wrangler runs the very same config fine.
// Miniflare lets you point at a specific binary with MINIFLARE_WORKERD_PATH,
// so this wrapper finds wrangler's copy and sets that variable before handing
// off to the real command.
//
// Deliberately conservative:
//   - Windows only. The crash is a Windows binary problem; Linux CI boots the
//     plugin's own workerd fine, and CI should stay on the stock path.
//   - Never overrides an explicit MINIFLARE_WORKERD_PATH.
//   - If wrangler's binary is missing, it changes nothing and the command runs
//     exactly as before.
//
// Usage (from an npm script, so node_modules/.bin is on PATH):
//   node scripts/with-workerd.mjs astro build
// =============================================================================
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const command = process.argv.slice(2).join(' ');
if (!command) {
  console.error('with-workerd: no command given');
  process.exit(1);
}

const env = { ...process.env };

if (process.platform === 'win32' && !env.MINIFLARE_WORKERD_PATH) {
  const wranglerWorkerd = resolve(
    ROOT,
    'node_modules/wrangler/node_modules/@cloudflare/workerd-windows-64/bin/workerd.exe',
  );
  if (existsSync(wranglerWorkerd)) {
    env.MINIFLARE_WORKERD_PATH = wranglerWorkerd;
    console.log("[with-workerd] using wrangler's workerd (the plugin's copy crashes on Windows)");
  }
}

// shell: true so the npm-script PATH resolves `astro` (a .cmd shim on Windows).
const result = spawnSync(command, { stdio: 'inherit', shell: true, env, cwd: ROOT });
process.exit(result.status ?? 1);
