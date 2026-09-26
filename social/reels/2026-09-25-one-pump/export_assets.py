"""Export One Pump media for the Remotion pilot (social/remotion).

Python stays the media-prep layer: it decodes HEIC, applies the SAME name
blurs as reel.py, synthesizes the SFX and music with reelkit, and writes
everything into an external Remotion public dir. Nothing lands in the repo.

    python social/reels/2026-09-25-one-pump/export_assets.py

Output: C:/Users/natha/Videos/WCP Reels/2026-09-25-one-pump-remotion/public/
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.io import wavfile

REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO / "social" / "reelkit"))
import reelkit as rk  # noqa: E402

SRC_DIR = Path(r"I:\Shared drives\WCP Publicity\Photography\26-27\Pre-K PM")
VID = SRC_DIR / "IMG_9194.MOV"
OUT = rk.default_out_dir("2026-09-25-one-pump-remotion") / "public"

# Keep in lockstep with reel.py: same stems, same blur boxes (source fractions).
BLUR = {"IMG_9195": [(0.545, 0.24, 0.872, 0.345)], "IMG_9237": [(0.08, 0.80, 0.18, 0.88)]}
PHOTOS = {  # stem -> long side in px (IMG_9195 stays near full res for the book zoom)
    "IMG_9196": 2200, "IMG_9195": 4200, "IMG_9245": 2200,
    "IMG_9203": 2200, "IMG_9204": 2200, "IMG_9237": 2200,
}
# Whisper transcript, corrected by ear (see LOG.md). Times are seconds into the clip.
CAPTIONS = [(0.0, 1.25, "Does that make them clean?"), (1.25, 2.35, "Are they clean now?"),
            (3.0, 4.35, "No, they're not clean."), (4.35, 5.5, "We need something else..."),
            (5.5, 7.25, "Special ingredient..."), (7.25, None, "So... how many times?")]
SFX_KINDS = dict(pop=rk.s_pop, ding=rk.s_ding, tick=rk.s_tick, stamp=rk.s_thud, slam=rk.s_slam,
                 whoosh=rk.s_whoosh, drumroll=rk.s_drumroll, party=rk.s_party)


def wav(path, x):
    """16-bit PCM mono at reelkit's SR. Peak-limited to avoid wraparound."""
    x = np.asarray(x, np.float32)
    x = np.clip(x, -1, 1)
    wavfile.write(str(path), rk.SR, (x * 32767).astype(np.int16))


def find_photo(stem):
    for ext in (".heic", ".HEIC", ".jpg", ".JPG", ".jpeg", ".JPEG"):
        p = SRC_DIR / f"{stem}{ext}"
        if p.exists():
            return p
    raise FileNotFoundError(stem)


# Storage bins on the left shelf of IMG_9194.MOV carry children's first names
# (readable at 1080p). The camera is handheld, so a fixed box drifts off them.
# We track the camera with ORB features on the static shelf/wall area and move
# the box with it. Box = source px in reference frame 100; it runs off the left
# edge on purpose to cover bins revealed when the camera pans.
VIDEO_BLUR_REF = 100
VIDEO_BLUR_BOX = [(-300, 354), (276, 354), (276, 530), (-300, 530)]


def export_blurred_video(src, dst, work):
    import cv2
    cap = cv2.VideoCapture(str(src))
    frames = []
    while True:
        ok, f = cap.read()
        if not ok:
            break
        frames.append(f)
    orb = cv2.ORB_create(3000)
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)

    def feats(f):
        g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY)
        m = np.zeros_like(g)
        m[:620, :900] = 255  # shelves + wall on the left; RANSAC rejects the kids
        return orb.detectAndCompute(g, m)

    kr, dr = feats(frames[VIDEO_BLUR_REF])
    box = np.float32(VIDEO_BLUR_BOX)
    h, w = frames[0].shape[:2]
    proc = subprocess.Popen([rk.ffmpeg(), "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{w}x{h}",
                             "-r", "30", "-i", "-", "-vf", "scale=1280:720:flags=lanczos", "-c:v", "libx264",
                             "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(dst)],
                            stdin=subprocess.PIPE)
    checks, min_inliers = [], 10 ** 9
    for i, f in enumerate(frames):
        k, d = feats(f)
        ms = sorted(bf.match(dr, d), key=lambda m: m.distance)[:400]
        M, inl = cv2.estimateAffinePartial2D(np.float32([kr[m.queryIdx].pt for m in ms]),
                                             np.float32([k[m.trainIdx].pt for m in ms]),
                                             method=cv2.RANSAC, ransacReprojThreshold=3)
        min_inliers = min(min_inliers, int(inl.sum()))
        pts = cv2.transform(box[None], M)[0]
        mask = np.zeros((h, w), np.uint8)
        cv2.fillPoly(mask, [np.int32(pts.round())], 255)
        mask = cv2.dilate(mask, np.ones((9, 9), np.uint8))
        a = cv2.GaussianBlur(mask, (0, 0), 5).astype(np.float32)[..., None] / 255
        f = (f * (1 - a) + cv2.GaussianBlur(f, (0, 0), 18) * a).astype(np.uint8)
        proc.stdin.write(f.tobytes())
        if i % 20 == 0 or i == len(frames) - 1:
            t = f[250:650, 0:640].copy()
            cv2.putText(t, str(i), (560, 390), 0, 1, (255, 255, 255), 2)
            checks.append(t)
    proc.stdin.close()
    proc.wait()
    # verification sheet (outside the repo): look at it before trusting the blur
    while len(checks) % 4:
        checks.append(np.zeros_like(checks[0]))
    sheet = np.vstack([np.hstack(checks[j:j + 4]) for j in range(0, len(checks), 4)])
    work.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(work / "video_blur_check.jpg"), cv2.resize(sheet, None, fx=0.75, fy=0.75))
    print("video blur: min RANSAC inliers", min_inliers, "-> check", work / "video_blur_check.jpg")


def main():
    for d in ("photos", "audio", "sfx", "fonts", "brand", "video"):
        (OUT / d).mkdir(parents=True, exist_ok=True)
    ff = rk.ffmpeg()

    # ---- photos (blur BEFORE downscale, exactly like reel.py) ----
    photo_meta = {}
    for stem, long_side in PHOTOS.items():
        im = rk.load_photo(find_photo(stem), long_side=long_side, blur=BLUR.get(stem))
        dst = OUT / "photos" / f"{stem}.jpg"
        im.save(dst, quality=92, subsampling=0)
        photo_meta[stem] = {"src": f"photos/{stem}.jpg", "w": im.width, "h": im.height,
                            "blurred": stem in BLUR}
        print("photo", stem, im.size, "blur" if stem in BLUR else "")

    # ---- video: tracked name blur, then H.264, no audio (dialogue is a separate wav) ----
    vid_dst = OUT / "video" / "IMG_9194.mp4"
    export_blurred_video(VID, vid_dst, OUT.parent / "_work")
    # same duration rule as reel.py (decoded frame count / source fps)
    _, v_end = rk.read_video_frames(VID, size=(64, 36))
    print("video", vid_dst.name, round(v_end, 3), "s")

    # ---- dialogue: stream 0:0, mono, peak 0.9, 150 ms fade (build_audio's recipe) ----
    raw = OUT / "audio" / "_dlg.raw"
    subprocess.run([ff, "-v", "error", "-y", "-i", str(VID), "-map", "0:0", "-ac", "1", "-ar", str(rk.SR),
                    "-f", "f32le", str(raw)], check=True)
    dlg = np.fromfile(str(raw), np.float32)
    raw.unlink()
    dlg = dlg / (np.abs(dlg).max() + 1e-6) * 0.9
    fo = int(0.15 * rk.SR)
    dlg[-fo:] *= np.linspace(1, 0, fo)
    wav(OUT / "audio" / "dialogue.wav", dlg)

    # ---- timeline (same segment durations as reel.py) ----
    segs = [("video", v_end), ("freeze", 1.15), ("one", 1.6), ("p1", 2.8), ("p2", 3.6),
            ("counter", 3.4), ("montage", 1.5 * 3 + 2.3), ("end", 3.4)]
    tl = rk.Timeline(segs)
    music_start = tl["one"][0] + 0.05

    # ---- sfx + music ----
    for kind, fn in SFX_KINDS.items():
        wav(OUT / "sfx" / f"{kind}.wav", fn())
    wav(OUT / "audio" / "music.wav", rk.music(tl.total - music_start + 0.1))

    # ---- fonts + brand ----
    fonts = REPO / "site" / "public" / "fonts"
    for f in ("captain-comic-bold.woff2", "captain-comic-regular.woff2"):
        shutil.copy2(fonts / f, OUT / "fonts" / f)
    qs = REPO / "site" / "node_modules" / "@fontsource-variable" / "quicksand" / "files" / "quicksand-latin-wght-normal.woff2"
    if qs.exists():
        shutil.copy2(qs, OUT / "fonts" / "quicksand-latin-wght-normal.woff2")
    brand = REPO / "site" / "src" / "assets" / "brand"
    logo = Image.open(brand / "wcp-logo-white.png").convert("RGBA")
    logo.crop(logo.getbbox()).save(OUT / "brand" / "wcp-logo-white.png")
    logo_n = Image.open(brand / "wcp-logo-navy.png").convert("RGBA")
    logo_n.crop(logo_n.getbbox()).save(OUT / "brand" / "wcp-logo-navy.png")

    timeline = {
        "slug": "2026-09-25-one-pump",
        "fps": rk.FPS, "width": rk.W, "height": rk.H,
        "total": tl.total,
        "segments": [{"name": n, "start": a, "end": b, "duration": b - a} for n, (a, b) in tl.segments.items()],
        "musicStart": music_start,
        "video": {"src": "video/IMG_9194.mp4", "duration": v_end},
        "captions": [{"start": a, "end": (b if b is not None else v_end + 1.15), "text": t} for a, b, t in CAPTIONS],
        "photos": photo_meta,
        "audio": {"dialogue": "audio/dialogue.wav", "music": "audio/music.wav",
                  "sfx": {k: f"sfx/{k}.wav" for k in SFX_KINDS}},
    }
    (OUT / "timeline.json").write_text(json.dumps(timeline, indent=2), encoding="utf-8")
    print("total", round(tl.total, 3), "->", OUT)


if __name__ == "__main__":
    main()
