#!/usr/bin/env node
// Stop a background `astro preview` server before a build.
//
// This Astro daemonizes `astro preview`, and on Windows the running server
// keeps a handle on dist/, so the next build dies with
// "EPERM ... dist\client" from emptyDir before it starts. free-dist.mjs
// releases locks it can see; it cannot stop a server it does not know about.
//
// Always exits 0: "no server was running" is the normal case, not a failure.
import { spawnSync } from 'node:child_process';

const r = spawnSync('npx', ['astro', 'preview', 'stop'], {
  encoding: 'utf8',
  shell: process.platform === 'win32',
});
const said = `${r.stdout ?? ''}${r.stderr ?? ''}`;
if (/Stopped preview server/i.test(said))
  console.log('stop-preview: stopped a running preview server.');
process.exit(0);
