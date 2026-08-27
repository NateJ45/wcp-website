// PORTABLE: canonical copy - ncs-astro-sanity-starter is the library of record for this file
// =============================================================================
// free-dist.mjs — release any lock on dist/ before a build (Windows)
// =============================================================================
// WHY THIS EXISTS
//
// A still-running `wrangler dev` / `astro preview` / `http-server` keeps a
// handle on dist/client. Astro empties dist at the start of every build, so
// the next `npm run build` (and therefore `npm run deploy`) dies with a
// cryptic:
//
//     EPERM, Permission denied: \\?\...\dist\client
//
// It reads like a permissions problem; it is really "something is still
// serving the last build". Copied into this repo 2026-08-27 from the
// presacademy repo, where it fixed two real deploys.
//
// On this stack the usual holder is `npm run serve:dist` (the Playwright
// webServer) or `npm run preview` (wrangler) from an earlier session.
//
// Runs as the `prebuild` npm hook, so it fires automatically.
//
// SAFETY — this kills processes, so it is deliberately narrow:
//   - Windows only (no-ops everywhere else, so Linux CI is untouched).
//   - Only node.exe / workerd.exe.
//   - Only when the command line mentions BOTH this project's site/ directory
//     AND a known dev-server (wrangler / miniflare / http-server / astro
//     preview). A node process doing anything else — including the editor or
//     agent session running this script — can never match.
//   - Prints every PID it kills.
// =============================================================================
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.platform !== 'win32') process.exit(0);

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Match on the project path so we can never touch an unrelated project's server.
// NOTE: a PowerShell single-quoted string treats backslashes LITERALLY, so the
// path must NOT be backslash-escaped here (doing that produced C:\\Users\\...,
// which matched nothing and let the EPERM through). Only ' needs doubling.
const ps = `
$root = '${ROOT.replace(/'/g, "''")}'
Get-CimInstance Win32_Process -Filter "Name='node.exe' OR Name='workerd.exe'" |
  Where-Object {
    $_.CommandLine -and
    $_.CommandLine -like "*$root*" -and
    $_.CommandLine -match 'wrangler|miniflare|http-server|astro preview'
  } |
  ForEach-Object { Write-Output $_.ProcessId; Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
`;

try {
  const out = execFileSync('powershell', ['-NoProfile', '-Command', ps], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
  if (out) {
    console.log(
      `[free-dist] stopped stale dev server(s) holding dist: ${out.split(/\s+/).join(', ')}`,
    );
  }
} catch {
  // Never block a build over this — if the query fails, just carry on and let
  // Astro report the EPERM as before.
}
