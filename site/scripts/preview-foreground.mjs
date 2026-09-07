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
//
// -----------------------------------------------------------------------------
// It also supervises that server, and owns the port itself.
// -----------------------------------------------------------------------------
// `wrangler dev` dies mid-suite on CI. Evidenced 2026-09-07 from the kept
// wrangler log (run 34149137652): CI points the hub's external origins at
// 127.0.0.1 in /etc/hosts, so every server-side fetch to them is refused and the
// run is a continuous storm of workerd "Network connection lost" / "Connection
// reset by peer". Nearly all of it is handled inside the worker and is harmless.
// But when one surfaces on the ProxyWorker's loopback path, wrangler's
// ProxyController treats ANY ProxyWorker error as fatal: it prints an empty
// `✘ [ERROR]` and exits 1. That is upstream and not ours to fix.
//
// Restarting it is not enough on its own. Run 34150362973 restarted cleanly and
// still lost a test: while the port is dead, `page.goto` fails INSTANTLY with
// ERR_CONNECTION_REFUSED, so a test can burn its attempt AND its retry inside
// the few seconds of the gap. Retries cannot cover a failure that fast.
//
// So this script owns the public port and proxies to wrangler on an internal
// one. A restart then costs LATENCY instead of a connection error: requests that
// arrive while the server is down are held and retried against it until it
// answers. Playwright's own 60s test timeout is the backstop, and a restart
// takes a fraction of that.
// =============================================================================
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import http from 'node:http';
import net from 'node:net';

const CONFIG = 'dist/server/wrangler.json';
// PORT is what the tests talk to and must not move: tests/.auth/*.json pins
// localhost:4321 as the cookie origin, and hub-gate.spec.ts sends that origin as
// a literal CSRF header. Only the upstream is new, and it stays private.
const PORT = Number(process.env.PREVIEW_PORT ?? 4321);
// The upstream is SEARCHED FOR, not assumed. PORT + 1 looked obvious and is not
// safe: on this Windows machine 4322 sits inside a reserved exclusion range, so
// workerd died on bind with WSAEACCES 10013 while an unrelated local service
// answered 404s on it — which read as "the hub route 404s" rather than "that
// port is taken". Scan a small window and take the first port we can actually
// bind ourselves.
const UPSTREAM_SCAN = 20;
const PROBE_PATH = '/family-hub/login';
const PUBLIC_PROBE = `http://localhost:${PORT}${PROBE_PATH}`;
const READY_TIMEOUT_MS = 180_000;
// How long a single request will wait out a restart before giving up. A measured
// restart is ~3s (CI run 34151272931), and Playwright's own 60s test timeout
// would fail the test long before this, so the bound is a safety net.
const UPSTREAM_GRACE_MS = 90_000;
const MAX_RESTARTS = 3;

let UPSTREAM_PORT = 0;
const upstreamProbe = () => `http://127.0.0.1:${UPSTREAM_PORT}${PROBE_PATH}`;

const bindable = (port) =>
  new Promise((resolve) => {
    const probe = net.createServer();
    probe.once('error', () => resolve(false));
    probe.once('listening', () => probe.close(() => resolve(true)));
    probe.listen(port, '127.0.0.1');
  });

async function pickUpstreamPort() {
  if (process.env.PREVIEW_UPSTREAM_PORT) return Number(process.env.PREVIEW_UPSTREAM_PORT);
  for (let port = PORT + 1; port <= PORT + UPSTREAM_SCAN; port += 1) {
    if (await bindable(port)) return port;
  }
  console.error(
    `preview-foreground: no free port in ${PORT + 1}-${PORT + UPSTREAM_SCAN} for wrangler.`,
  );
  process.exit(1);
}

if (!existsSync(CONFIG)) {
  console.error(`preview-foreground: ${CONFIG} is missing — run \`npm run build\` first.`);
  process.exit(1);
}

let server = null;
let proxy = null;
let ready = false;
let shuttingDown = false;
let restartsLeft = MAX_RESTARTS;

// -----------------------------------------------------------------------------
// wrangler
// -----------------------------------------------------------------------------
function startWrangler() {
  const child = spawn('npx', ['wrangler', 'dev', '-c', CONFIG, '--port', String(UPSTREAM_PORT)], {
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

  // A FIRST start that never became ready is a broken build, not a crash. Fail
  // fast rather than looping on it.
  if (!ready || restartsLeft <= 0) {
    if (ready) {
      console.error(`preview-foreground: already restarted ${MAX_RESTARTS} times; giving up.`);
    }
    stop();
    process.exit(code ?? 1);
  }

  ready = false;
  restartsLeft -= 1;
  console.error(
    `preview-foreground: restarting it (${restartsLeft} restart(s) left after this). ` +
      'Requests are being held until it answers.',
  );

  const downSince = Date.now();
  server = startWrangler();
  waitUntilReady().then((back) => {
    if (back) {
      // console.ERROR, not log: Playwright pipes a webServer's stderr into the
      // run output and DISCARDS its stdout, so a console.log here is invisible
      // in CI — which is how run 34150362973 recorded the crash and the restart
      // but not the recovery or how long the port was dead. The outage length is
      // the number that says whether the held requests were covered, so it has
      // to reach the log.
      console.error(
        `preview-foreground: back up after ${Math.round((Date.now() - downSince) / 1000)}s down.`,
      );
    } else if (!shuttingDown) {
      console.error('preview-foreground: it did not come back.');
      stop();
      process.exit(1);
    }
  });
}

// -----------------------------------------------------------------------------
// The proxy
// -----------------------------------------------------------------------------
// Hop-by-hop headers describe THIS connection, not the message, so they must not
// be forwarded onto the next one.
const HOP_BY_HOP = ['connection', 'keep-alive', 'transfer-encoding', 'upgrade'];
const strip = (headers) => {
  const out = { ...headers };
  for (const h of HOP_BY_HOP) delete out[h];
  return out;
};

// Retry only when the request provably never reached the worker. ECONNREFUSED
// means nothing was listening, so nothing ran — safe for any method, including
// the POSTs the admin-write suite makes. A reset can land mid-processing, so
// that one is only retried for methods that are idempotent anyway.
const retryable = (err, method) =>
  err.code === 'ECONNREFUSED' ||
  ((err.code === 'ECONNRESET' || err.code === 'ECONNABORTED') &&
    (method === 'GET' || method === 'HEAD'));

function handle(req, res) {
  // Buffered, because a held request has to be replayable once the server is
  // back. Test traffic is small; this is a test harness, not a production edge.
  const chunks = [];
  req.on('error', () => {});
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => forward(Buffer.concat(chunks), Date.now() + UPSTREAM_GRACE_MS));

  // If the client walks away (Playwright navigating on, or a test ending), drop
  // the upstream request with it rather than leaking a socket. Registered ONCE
  // and pointed at the current attempt: a held request retries every 250ms, so
  // a listener per attempt would trip Node's max-listeners warning inside a few
  // seconds of an outage — noise in the very log we read to diagnose outages.
  let current = null;
  res.on('close', () => {
    if (!res.writableEnded) current?.destroy();
  });

  function forward(body, deadline) {
    const headers = strip(req.headers);
    if (body.length) headers['content-length'] = String(body.length);

    const upstream = http.request(
      { host: '127.0.0.1', port: UPSTREAM_PORT, method: req.method, path: req.url, headers },
      (upRes) => {
        res.writeHead(upRes.statusCode ?? 502, strip(upRes.headers));
        upRes.pipe(res);
        upRes.on('error', () => res.destroy());
      },
    );

    upstream.on('error', (err) => {
      // Once a byte of the response is out, the exchange is no longer replayable.
      if (res.headersSent || res.writableEnded) {
        res.destroy();
        return;
      }
      if (!shuttingDown && Date.now() < deadline && retryable(err, req.method)) {
        setTimeout(() => forward(body, deadline), 250);
        return;
      }
      res.writeHead(502, { 'content-type': 'text/plain' });
      res.end(`preview-foreground: upstream unavailable (${err.code ?? err.message}).`);
    });

    current = upstream;
    upstream.end(body);
  }
}

// -----------------------------------------------------------------------------
// Lifecycle
// -----------------------------------------------------------------------------
const stop = () => {
  shuttingDown = true;
  if (proxy) proxy.close();
  if (server && !server.killed) server.kill();
};
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, () => (stop(), process.exit(0)));
process.on('exit', stop);

// Require a REAL answer, not merely an answer. An earlier version treated any
// HTTP status as ready, so `astro preview`'s 404 on every SSR route looked
// healthy and the failure surfaced 420 seconds later as an unexplained
// Playwright timeout.
async function waitUntilReady() {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline && !shuttingDown) {
    try {
      const res = await fetch(upstreamProbe(), { redirect: 'manual' });
      if (res.status < 400) {
        ready = true;
        return true;
      }
      console.log(`preview-foreground: ${upstreamProbe()} answered ${res.status}; still waiting…`);
    } catch {
      /* not listening yet */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

UPSTREAM_PORT = await pickUpstreamPort();
server = startWrangler();

if (!(await waitUntilReady())) {
  console.error(
    `preview-foreground: ${upstreamProbe()} never returned < 400 within ${READY_TIMEOUT_MS}ms.`,
  );
  stop();
  process.exit(1);
}

// The public port appears only once the app is genuinely serving, so Playwright's
// own readiness check keeps the meaning it had when wrangler bound this port
// directly: the port existing means the hub answers.
proxy = http.createServer(handle);
proxy.on('error', (err) => {
  console.error(`preview-foreground: could not serve on ${PORT} — ${err.message}`);
  stop();
  process.exit(1);
});
await new Promise((resolve) => proxy.listen(PORT, '127.0.0.1', resolve));
console.log(`preview-foreground: ready at ${PUBLIC_PROBE} (wrangler on ${UPSTREAM_PORT}).`);
// wrangler and the proxy keep this process alive; no artificial handle needed.
