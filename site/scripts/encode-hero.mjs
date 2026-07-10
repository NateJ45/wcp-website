// ============================================================================
// Encode the hero background video → web-optimized MP4 + WebM
// ============================================================================
// The raw hero footage is large (e.g. ~9MB at 720p). This produces two small,
// muted, loop-friendly derivatives for a full-bleed background that sits behind
// the navy scrim (so 540p is plenty, and audio is dropped):
//
//   • wcp-hero.mp4   — H.264, universal fallback
//   • wcp-hero.webm  — VP9, smaller; modern browsers prefer it
//
// Both are gitignored (see .gitignore) — they live locally and ship via the
// build's public/ → dist/ copy. Keep the untouched master as *-source.mp4.
//
// Usage:  npm run encode:hero            (uses public/hero/wcp-hero-source.mp4)
//         npm run encode:hero -- <input> (any source file)
//
// Settings chosen 2026-07: 960×540, 24fps. MP4 CRF 33; WebM VP9 two-pass @600k
// (VP9 is more efficient, so 600k ≈ the MP4's quality at a smaller size).
// ============================================================================
import { spawnSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import ffmpeg from 'ffmpeg-static';

const heroDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'hero');
const input = process.argv[2] ?? join(heroDir, 'wcp-hero-source.mp4');
const mp4 = join(heroDir, 'wcp-hero.mp4');
const webm = join(heroDir, 'wcp-hero.webm');
const passlog = join(heroDir, 'vp9pass');
const VF = 'fps=24,scale=960:-2';

if (!existsSync(input)) {
  console.error(`Input not found: ${input}`);
  process.exit(1);
}

const run = (label, args) => {
  console.log(`\n▶ ${label}`);
  const r = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(`ffmpeg failed: ${label}`);
    process.exit(r.status ?? 1);
  }
};

// MP4 (H.264)
run('MP4 (H.264, CRF 33)', [
  '-i', input, '-map', '0:v:0', '-an', '-vf', VF,
  '-c:v', 'libx264', '-crf', '33', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4,
]);

// WebM (VP9, two-pass @ 600k)
const vp9 = (pass, out) => [
  '-i', input, '-map', '0:v:0', '-an', '-vf', VF,
  '-c:v', 'libvpx-vp9', '-b:v', '600k', '-pass', String(pass), '-passlogfile', passlog,
  '-deadline', 'good', '-cpu-used', pass === 1 ? '4' : '2', '-row-mt', '1', ...out,
];
run('WebM (VP9 pass 1)', vp9(1, ['-f', 'null', '-']));
run('WebM (VP9 pass 2)', vp9(2, [webm]));
rmSync(`${passlog}-0.log`, { force: true });

console.log('\n✓ Done — wrote wcp-hero.mp4 and wcp-hero.webm');
