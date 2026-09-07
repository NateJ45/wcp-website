#!/usr/bin/env node
// =============================================================================
// preview-foreground.mjs — keep `astro preview` in the foreground for Playwright
// =============================================================================
// playwright.hub.config.ts used `npm run preview` directly, on the stated
// grounds that "astro preview runs wrangler in the foreground". That was true
// when it was written and is not any more: this Astro version DAEMONIZES the
// preview server and the launching command exits 0 immediately —
//
//     Preview server running at http://localhost:4321 (pid 51100)
//     preview exited with: 0
//
// Playwright reads that exit as a startup failure ("Process from
// config.webServer exited early") and never runs a single test. The whole gated
// hub suite has therefore been unrunnable, and because CI never invoked it,
// nothing said so.
//
// This starts the same server, waits until it actually answers, then stays
// alive so Playwright sees a healthy long-running process — and stops the
// daemon again on the way out, so a killed test run does not leave a stale
// server serving an old build to the next one. That happened during this
// session and cost a confusing round of "the fix did not take".
// =============================================================================
import { spawnSync } from 'node:child_process';

const URL_TO_PROBE = process.env.PREVIEW_URL ?? 'http://localhost:4321/family-hub/login';
const READY_TIMEOUT_MS = 120_000;

const run = (args) =>
  spawnSync('npx', ['astro', 'preview', ...args], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

const stop = () => {
  const r = run(['stop']);
  if (r.status === 0) console.log('preview-foreground: stopped the preview server.');
};

// Never inherit a server from a previous run. Two reasons, both seen tonight:
// it would serve the PREVIOUS build so every later failure points at the wrong
// thing, and on Windows it holds a handle on dist/ so the rebuild dies with
// "EPERM ... dist\client" before a single test runs.
//
// This is also why the BUILD happens here rather than ahead of this script in
// the webServer command: the server has to be stopped first, and only this
// process knows to do that.
stop();

if (!process.argv.includes('--no-build')) {
  console.log('preview-foreground: building…');
  // CAPTURE the build's output rather than inheriting it. Playwright reads this
  // process's stdout through a pipe, and handing that same pipe to a chatty
  // child (pagefind, the OG image generator) deadlocked the build partway
  // through postbuild — the run then died on the webServer timeout with no clue
  // which step had stalled. Captured, it cannot block; only the tail is printed,
  // and the whole log on failure.
  const built = spawnSync('npm', ['run', 'build'], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    shell: process.platform === 'win32',
  });
  if (built.status !== 0) {
    console.error('preview-foreground: the build failed; not starting a server.');
    console.error((built.stdout || '') + (built.stderr || ''));
    process.exit(1);
  }
  console.log('preview-foreground: build ok.');
}

const started = run([]);
if (started.status !== 0) {
  console.error('preview-foreground: could not start the preview server.');
  console.error((started.stdout || '') + (started.stderr || ''));
  process.exit(1);
}
console.log('preview-foreground: started; waiting for it to answer…');

const deadline = Date.now() + READY_TIMEOUT_MS;
let ready = false;
while (Date.now() < deadline) {
  try {
    const res = await fetch(URL_TO_PROBE, { redirect: 'manual' });
    // Any HTTP answer means the server is up. The login page is 200, but a
    // redirect is just as good a proof of life — only a refused connection is
    // "not ready".
    if (res.status > 0) {
      ready = true;
      break;
    }
  } catch {
    await new Promise((r) => setTimeout(r, 500));
  }
}

if (!ready) {
  console.error(`preview-foreground: ${URL_TO_PROBE} never answered within ${READY_TIMEOUT_MS}ms.`);
  stop();
  process.exit(1);
}

console.log(`preview-foreground: ready at ${URL_TO_PROBE}. Holding the process open.`);

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(signal, () => {
    stop();
    process.exit(0);
  });
}
// Playwright kills this process when the run ends; the handlers above stop the
// daemon. Until then, hold the event loop open with a REAL handle.
//
// `await new Promise(() => {})` looks like the obvious way to wait forever and
// is not: with nothing else pending, Node calls that an unsettled top-level
// await and exits 13, which Playwright reports as the server failing to start.
// A long interval is an actual libuv handle, so the loop stays alive.
setInterval(() => {}, 1 << 30);
