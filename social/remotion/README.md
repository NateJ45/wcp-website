# WCP social: Remotion motion layer (pilot)

A React/Remotion project that animates WCP reels and carousels. It was built
as a pilot that rebuilds the 2026-09-25 "One Pump" reel
(`social/reels/2026-09-25-one-pump/reel.py`) so the two pipelines can be
compared. Read `social/CLAUDE.md` first: every hard rule there (public repo,
children's names, releases, no em-dashes, synthesized music only, never
publish) applies here too.

## How the pieces split

- **Python prepares media.** A per-reel `export_assets.py` uses `reelkit` to
  decode HEIC, apply the name blurs, transcode the clip, synthesize the SFX and
  music, and write `timeline.json`. Output goes to an external folder, never
  into this repo.
- **Remotion animates and lays out.** This project reads that folder as its
  public dir and renders the video or stills.

## One-time setup

```
cd social/remotion
npm install
```

Versions are pinned exactly in `package.json` (Remotion 4.0.529, React
19.2.8). The first render downloads Chrome Headless Shell into
`node_modules`. `node_modules/` and `out/` are gitignored.

## 1. Export the assets (Python)

```
python social/reels/2026-09-25-one-pump/export_assets.py
```

This writes `C:\Users\natha\Videos\WCP Reels\2026-09-25-one-pump-remotion\public\`:

| Path | What |
|---|---|
| `photos/*.jpg` | every photo the reel uses, blurred exactly like `reel.py` (blur before downscale); IMG_9195 kept at 4200 px for the book zoom |
| `video/IMG_9194.mp4` | the clip, H.264 1280x720, no audio, with a **tracked** blur over the storage-bin names (see below) |
| `audio/dialogue.wav` | stream 0:0, peak 0.9, 150 ms fade (reelkit's recipe) |
| `audio/music.wav` | `reelkit.music()` for the post-slam length |
| `sfx/*.wav` | pop, ding, tick, stamp, slam, whoosh, drumroll, party |
| `fonts/`, `brand/` | Captain Comic woff2, Quicksand, white and navy logos |
| `timeline.json` | segment starts and durations, corrected captions with times, photo sizes, audio paths |

It also writes `_work/video_blur_check.jpg`. **Look at it** before rendering:
it shows the tracked blur on every 20th frame.

**Video name blur.** The shelf on the left of IMG_9194.MOV has bins labeled
with children's first names. The camera is handheld, so a fixed box drifts.
The export tracks the camera with ORB features on the static shelf and wall
(`cv2.estimateAffinePartial2D`, RANSAC) and moves the box with it. Any new
reel with names in video needs the same treatment and the same visual check.

## 2. Preview

```
cd social/remotion
npx remotion studio --public-dir "C:/Users/natha/Videos/WCP Reels/2026-09-25-one-pump-remotion/public"
```

`remotion.config.ts` defaults the public dir to the One Pump export (or
`$WCP_REEL_PUBLIC`). `--public-dir` on the command line overrides it, which is
the way to point at another reel's export.

## 3. Render

Reel (about 40 s wall clock on this machine for 32 s of video):

```
npx remotion render OnePump "C:/Users/natha/Videos/WCP Reels/2026-09-25-one-pump-remotion/_work/raw.mp4"
```

Remotion does not normalize loudness. The raw mix measures about -24.5 LUFS,
so finish with a two-pass `loudnorm` to about -14 LUFS, copying the video
stream (ffmpeg is not on PATH; this is reelkit's bundled binary):

```
FF=$(python -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
"$FF" -i raw.mp4 -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null -
# feed the printed input_i / input_tp / input_lra / input_thresh / target_offset back in:
"$FF" -i raw.mp4 -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=..:measured_TP=..:measured_LRA=..:measured_thresh=..:offset=..:linear=true,aresample=48000" \
  -c:a aac -b:a 192k -ac 2 -movflags +faststart final.mp4
"$FF" -i final.mp4 -af ebur128=peak=true -f null -   # verify
```

For the no-music cut, pass `--props='{"withMusic": false}'` (not exercised in
the pilot).

Carousel (Instagram feed, 1080x1350, one frame per slide):

```
npx remotion still OnePumpCarousel --frame=0 "<out>/one-pump-carousel-1.png"
...
npx remotion still OnePumpCarousel --frame=4 "<out>/one-pump-carousel-5.png"
```

Each slide is wrapped in `<Freeze frame={200}>` so every entrance animation is
finished. **Gotcha:** `Freeze` clamps to the composition length, so the
carousel composition is 250 frames long. With 5 frames, every sticker froze
mid-spring and the check marks never drew.

## Layout

```
src/
  index.ts            registerRoot
  Root.tsx            compositions; duration comes from timeline.json via calculateMetadata
  brand.ts            palette + CLASS_COLORS mirroring site globals.css, font loading, safe area
  motion.ts           springs (SLAP, THUD, SOFT), ramp, easeInOut, seeded shake
  components/
    PaperBackground   brand colour + SVG-turbulence grain + vignette + the site's doodle wallpaper
    Placed            centre-anchored positioning (like reelkit.place)
    Sticker           rounded label that rotates in on a spring, shadow tightens as it lands,
                      optional hand-drawn check, word-by-word reveal, peel-away exit
    PrintCard         white-bordered print with Ken Burns (same crop maths as reelkit.kb_crop),
                      washi tape, and an overlay pinned to source-image coordinates
    Doodle            marker strokes that draw themselves: circle, underline, strike,
                      scribble, burst, arrow
    Caption           real dialogue cues as stickers
    SlamText          giant word slam with impact burst and seeded shake
    StampText         rubber stamp with an ink-grain mask
    Confetti          seeded paper confetti with 3D flip
    EndCard           navy end card, logo, sign-off with underline
  one-pump/
    timeline.ts       timeline.json types + loader
    scenes.tsx        the beats (same timings as reel.py)
    OnePump.tsx       composition + audio placement (SFX schedule copied from reel.py)
    OnePumpCarousel   five feed slides built from the same components
```

Rotation note: CSS rotates clockwise for positive degrees and PIL rotates
counter-clockwise, so a `reel.py` angle `r` becomes `-r` here.

Everything is a pure function of the frame (springs, `random(seed)`, no
`Math.random`, no timers), so Studio, stills and renders agree.

## Making the next piece

1. Copy `social/reels/2026-09-25-one-pump/export_assets.py` into the new reel
   folder and change the stems, blur boxes, captions and segments.
2. Copy `src/one-pump/` to `src/<slug>/`, rewrite the scenes, and register the
   compositions in `Root.tsx`. Reuse the components rather than drawing new ones.
3. Render stills at key times and look at them (blurs, faces, safe area:
   nothing important in the top 220 px or bottom 300 px of a reel).

## License (checked 2026-09-26, `node_modules/remotion/LICENSE.md`)

Remotion is source-available under its own license. It is not MIT. The Free
License covers "an individual", "a for-profit organization with up to 3
employees", "a non-profit or not-for-profit organization", and anyone
evaluating it without commercial use. It allows commercial and non-commercial
use "for the purpose of creating videos and images". Everyone else, meaning
for-profit organizations with more than 3 employees, needs a paid Company
License (remotion.pro). Reselling or relicensing a modified Remotion is not
allowed for anyone. The file also notes that the terms will change slightly
in Remotion 5.0.

WCP is a volunteer-run nonprofit co-op, so it falls under the Free License.
Using Remotion for Nathan's own client work would also be free while his
studio is an individual or has 3 or fewer employees. Re-check the license
when upgrading to 5.0.
