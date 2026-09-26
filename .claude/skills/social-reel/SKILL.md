---
name: social-reel
description: Make a West Chester Preschool social media reel or short video (Facebook/Instagram) from class photos and clips in the WCP Publicity Drive. Use whenever Nathan asks for a reel, social post video, TikTok/Instagram/Facebook video, or shares class-rep photos/.MOV/.HEIC files for a post.
---

# WCP social reel

1. Read `social/CLAUDE.md` in full (brief, hard rules, workflow, gotchas), then
   `social/STYLE.md` and the newest entry in `social/LOG.md`.
2. Follow the workflow there: intake with `social/reelkit/reelkit.py intake`,
   find the one joke, run the face check sheet, prepare blurred media with a
   new `social/reels/<YYYY-MM-DD-slug>/export_assets.py`, animate it in
   `social/remotion/`, render, loudnorm, verify the encoded file at 2x, then
   deliver both MP4s (or carousel PNGs) with SendUserFile plus a caption.
3. Non-negotiables: no media in git (the repo is public), send the face check
   sheet (`facesheet.py build`) and blur the faces Nathan ticks, blur every readable
   child's name, no em-dashes, synthesized music only, never post on Nathan's
   behalf.
4. Finish by adding a `social/LOG.md` entry and any new gotcha to
   `social/CLAUDE.md`.
