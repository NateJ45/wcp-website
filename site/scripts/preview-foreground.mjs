#!/usr/bin/env node
// =============================================================================
// preview-foreground.mjs — serve the SSR build for Playwright, in the foreground
// =============================================================================
// playwright.hub.config.ts used `npm run preview`, on the stated grounds that
// "astro preview runs wrangler in the foreground and serves the same SSR
// build". BOTH halves of that stopped being true:
//
//   1. It daemonizes. The launching command prints "Preview server running at
//      …" and exits 0, which Playwright reads as "webServer exited early".
//   2. It only serves STATIC dist/client. Its own --help says "serve your
//      static dist/ directory", so every SSR route — the whole gated hub —
//      answers 404. A server that is up and 404s on the route under test is
//      worse than one that is down, because it looks alive.
//
// The consequence: the hub suite could not run, and because CI never invoked it
// either (`test:hub` existed and no workflow called it), nothing said so. Eleven
// specs, including the one asserting a stranger is locked out, were green by
// absence.
//
// `wrangler dev` on the emitted worker config serves the real SSR build, in the
// foreground, which is what Playwright's webServer contract wants.
// =============================================================================
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const CONFIG = 'dist/server/wrangler.json';
const PORT = process.env.PREVIEW_PORT ?? '4321';
const PROBE = `http://localhost:${PORT}/family-hub/login`;
const READY_TIMEOUT_MS = 180_000;

if (!existsSync(CONFIG)) {
  console.error(`preview-foreground: ${CONFIG} is missing — run \`npm run build\` first.`);
  process.exit(1);
}

const server = spawn('npx', ['wrangler', 'dev', '-c', CONFIG, '--port', PORT], {
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: process.platform === 'win32',
});
// Drain both streams. Left unread they fill and block the child mid-request.
server.stdout.on('data', (d) => process.stdout.write(`[wrangler] ${d}`));
server.stderr.on('data', (d) => process.stderr.write(`[wrangler] ${d}`));
server.on('exit', (code) => {
  console.error(`preview-foreground: wrangler exited (${code}).`);
  process.exit(code ?? 1);
});

const stop = () => {
  if (!server.killed) server.kill();
};
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, () => (stop(), process.exit(0)));
process.on('exit', stop);

// Require a REAL answer, not merely an answer. The earlier version treated any
// HTTP status as ready, so `astro preview`'s 404 on every SSR route looked
// healthy and the failure surfaced 420 seconds later as an unexplained
// Playwright timeout.
const deadline = Date.now() + READY_TIMEOUT_MS;
let ready = false;
while (Date.now() < deadline) {
  try {
    const res = await fetch(PROBE, { redirect: 'manual' });
    if (res.status < 400) {
      ready = true;
      break;
    }
    console.log(`preview-foreground: ${PROBE} answered ${res.status}; still waiting…`);
  } catch {
    /* not listening yet */
  }
  await new Promise((r) => setTimeout(r, 1000));
}

if (!ready) {
  console.error(`preview-foreground: ${PROBE} never returned < 400 within ${READY_TIMEOUT_MS}ms.`);
  stop();
  process.exit(1);
}
console.log(`preview-foreground: ready at ${PROBE}.`);
// wrangler keeps this process alive; no artificial handle needed.
