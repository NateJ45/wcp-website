# WCP social videos

Tooling and notes for turning class-rep photos and clips into Facebook and
Instagram reels.

- **Asking an agent for a reel:** point it at the Drive folder, paste what the
  rep said, and say "make a reel". The `social-reel` project skill loads
  `social/CLAUDE.md`, which has the full brief.
- **Finished videos:** `C:\Users\natha\Videos\WCP Reels\<date-slug>\`.
- **What's here:** `CLAUDE.md` (agent brief and rules), `STYLE.md` (look, voice,
  captions), `LOG.md` (past pieces), `reelkit/` (Python media prep: intake,
  name and face blurs, the face check sheet, crops, cutouts, audio),
  `remotion/` (animation for reels and carousels), `data/` (class facts from
  the website), `reels/<date-slug>/` (one folder per piece, re-runnable).
- **Before a reel renders** you get a face check sheet: tick any child
  without a photo release and those faces get blurred.
- **Planning:** the WCP Post Board artifact tracks every piece, and a Friday
  routine drafts one piece from the week's uploads. It never posts.

This repo is public. Photos and videos of the kids never get committed here.

Re-render the first reel (Pillow version) after tweaking its script:

```bash
python social/reels/2026-09-25-one-pump/reel.py
```

Remotion pieces: see `remotion/README.md` for the export, preview and render steps.
