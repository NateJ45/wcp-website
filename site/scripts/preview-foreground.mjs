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

// -----------------------------------------------------------------------------
// Supervise wrangler, do not merely launch it.
// -----------------------------------------------------------------------------
// `wrangler dev` dies mid-suite on CI. Evidenced 2026-09-07 from the kept
// wrangler log (run 34149137652): the hosts file points the hub's external
// origins at 127.0.0.1, so every server-side fetch to them is refused, and the
// run is a continuous storm of workerd "Network connection lost" / "Connection
// reset by peer". Almost all of it is harmless and handled inside the worker.
// But when one of those surfaces on the ProxyWorker's loopback path,
// wrangler's ProxyController treats ANY ProxyWorker error as fatal: it prints
// an empty `✘ [ERROR]` and exits 1. 66s into that run it did, and the
// remaining 66 tests failed on "Connection refused" with the code healthy.
//
// The fatal-ness is upstream and not ours to fix, so absorb it: restart the
// server and wait for it to answer again. `retries: 1` then rescues the tests
// that were in flight, because the SERVER is back rather than gone.
//
// Deliberately NOT restarted: a first start that never becomes ready. That is
// a broken build and must fail fast instead of looping.
const MAX_RESTARTS = 3;

let server = null;
let ready = false;
let shuttingDown = false;
let restartsLeft = MAX_RESTARTS;

function startWrangler() {
  const child = spawn('npx', ['wrangler', 'dev', '-c', CONFIG, '--port', PORT], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
  });
  // Drain both streams. Left unread they fill and block the child mid-request.
  child.stdout.on('data', (d) => process.stdout.write(`[wrangler] ${d}`));
  child.stderr.on('data', (d) => process.stderr.write(`[wrangler] ${d}`));
  child.on('exit', (code) => onWranglerExit(child, code));
  return child;
}

function onWranglerExit(child, code) {
  if (shuttingDown || child !== server) return;
  console.error(`preview-foreground: wrangler exited (${code}).`);
  if (!ready || restartsLeft <= 0) {
    if (ready) {
      console.error(`preview-foreground: already restarted ${MAX_RESTARTS} times; giving up.`);
    }
    process.exit(code ?? 1);
  }
  restartsLeft -= 1;
  console.error(`preview-foreground: restarting it (${restartsLeft} restart(s) left after this).`);
  server = startWrangler();
  // Re-probe. If it will not come back, there is nothing left to serve, so
  // exit and let Playwright report the webServer failure rather than run the
  // rest of the suite against a dead port.
  waitUntilReady().then((back) => {
    if (back) {
      console.log(`preview-foreground: back up at ${PROBE}.`);
    } else if (!shuttingDown) {
      console.error('preview-foreground: it did not come back.');
      stop();
      process.exit(1);
    }
  });
}

const stop = () => {
  shuttingDown = true;
  if (server && !server.killed) server.kill();
};
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, () => (stop(), process.exit(0)));
process.on('exit', stop);

server = startWrangler();

// Require a REAL answer, not merely an answer. The earlier version treated any
// HTTP status as ready, so `astro preview`'s 404 on every SSR route looked
// healthy and the failure surfaced 420 seconds later as an unexplained
// Playwright timeout.
async function waitUntilReady() {
  ready = false;
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline && !shuttingDown) {
    try {
      const res = await fetch(PROBE, { redirect: 'manual' });
      if (res.status < 400) {
        ready = true;
        return true;
      }
      console.log(`preview-foreground: ${PROBE} answered ${res.status}; still waiting…`);
    } catch {
      /* not listening yet */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

if (!(await waitUntilReady())) {
  console.error(`preview-foreground: ${PROBE} never returned < 400 within ${READY_TIMEOUT_MS}ms.`);
  stop();
  process.exit(1);
}
console.log(`preview-foreground: ready at ${PROBE}.`);
// wrangler keeps this process alive; no artificial handle needed.
