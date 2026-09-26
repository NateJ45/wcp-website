# WCP social videos

Tooling and notes for turning class-rep photos and clips into Facebook and
Instagram reels.

- **Asking an agent for a reel:** point it at the Drive folder, paste what the
  rep said, and say "make a reel". The `social-reel` project skill loads
  `social/CLAUDE.md`, which has the full brief.
- **Finished videos:** `C:\Users\natha\Videos\WCP Reels\<date-slug>\`.
- **What's here:** `CLAUDE.md` (agent brief and rules), `STYLE.md` (look, voice,
  captions), `LOG.md` (past pieces), `reelkit/` (render library),
  `reels/<date-slug>/reel.py` (one script per piece, re-runnable).

This repo is public. Photos and videos of the kids never get committed here.

Re-render a past reel after tweaking its script:

```bash
python social/reels/2026-09-25-one-pump/reel.py
```
