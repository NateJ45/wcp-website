#!/usr/bin/env node
// =============================================================================
// stop-preview.mjs — free the preview port (and dist/) before a build
// =============================================================================
// On Windows a running dev server keeps a handle on dist/, so the next build
// dies in Astro's emptyDir with:
//
//     EPERM, Permission denied: \?\...\site\dist\client
//
// free-dist.mjs releases locks it can find; it cannot stop a SERVER it does not
// know about. Two kinds have to go:
//
//   - a daemonized `astro preview` (this Astro backgrounds it), and
//   - `wrangler dev` plus its `workerd` children, which is what the hub tests
//     now use because `astro preview` only serves static dist/client and 404s
//     every SSR route.
//
// Killing workerd alone is not enough: wrangler supervises it and immediately
// starts another, so the port never frees. Whatever OWNS the listening socket
// is what has to be killed, and killing the tree takes the children with it.
//
// Always exits 0. "Nothing was running" is the normal case, not a failure.
// =============================================================================
import { spawnSync } from 'node:child_process';

const PORT = process.env.PREVIEW_PORT ?? '4321';
const sh = (cmd, args) =>
  spawnSync(cmd, args, { encoding: 'utf8', shell: process.platform === 'win32' });

// 1. The legacy daemon, if this project still has one running.
const stopped = sh('npx', ['astro', 'preview', 'stop']);
if (/Stopped preview server/i.test(`${stopped.stdout ?? ''}${stopped.stderr ?? ''}`)) {
  console.log('stop-preview: stopped a daemonized astro preview.');
}

// 2. Whoever holds the port.
const pids = new Set();
if (process.platform === 'win32') {
  const net = sh('netstat', ['-ano']);
  for (const line of (net.stdout ?? '').split('\n')) {
    if (!line.includes('LISTENING') || !line.includes(`:${PORT}`)) continue;
    const pid = line.trim().split(/\s+/).pop();
    if (pid && pid !== '0') pids.add(pid);
  }
} else {
  const lsof = sh('lsof', ['-ti', `tcp:${PORT}`]);
  for (const pid of (lsof.stdout ?? '').split('\n').map((p) => p.trim()).filter(Boolean)) {
    pids.add(pid);
  }
}

for (const pid of pids) {
  // /T takes the child processes with it — killing workerd on its own just lets
  // wrangler spawn a replacement.
  const killed =
    process.platform === 'win32'
      ? sh('taskkill', ['/F', '/T', '/PID', pid])
      : sh('kill', ['-9', pid]);
  if (killed.status === 0) console.log(`stop-preview: freed port ${PORT} (pid ${pid}).`);
}

// Windows releases file handles a moment after the process dies; building
// immediately can still hit EPERM.
if (pids.size) spawnSync(process.execPath, ['-e', 'setTimeout(()=>{},1500)']);
process.exit(0);
