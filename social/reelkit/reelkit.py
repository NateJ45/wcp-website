"""reelkit — small toolkit for rendering 1080x1920 "reel" videos.

Extracted from a one-off social-media reel renderer so the pieces are
reusable across reels. Nothing in here is specific to any one reel's
creative content, timings, or captions — that lives in the calling script.

API summary:
  Constants: W, H, FPS, SR, and the brand palette (NAVY/SKY/ORANGE/AMBER/
    GREEN/WHITE/CREAM/GREENINK) + CLASS_COLORS.
  ffmpeg() -> path to the bundled ffmpeg exe.
  font(size, bold=True) -> PIL ImageFont, auto-converted from the repo's
    Captain Comic woff2 into a per-user TTF cache on first use.
  Easing: clamp, ease_out_cubic, ease_in_out, ease_out_back, pop, shake.
  Drawing: paper(color), text_img(...), sticker(...), place(...),
    print_card(...), kb_crop(...), kb_card(...).
  Photos/video: load_photo(path, long_side, blur), read_video_frames(path).
  Confetti(seed=3): .draw(base, t).
  Audio: s_pop/s_ding/s_tick/s_thud/s_crash/s_slam/s_whoosh/s_drumroll/
    s_party, ks(...), music(dur, bpm=116), build_audio(...).
  Timeline(segments) -> ordered (name, duration) -> (start, end) map.
  render(frame_fn, total, out_dir, slug, sfx, ...) -> renders + muxes
    <slug>-music.mp4 and <slug>-nomusic.mp4.
  preview(frame_fn, times, out_dir) -> stills + one contact sheet.
  contact_sheet(paths, out, tile, cols) -> labeled tiled JPG.
  transcribe(video_path, model="small") -> [(start, end, text), ...].
  default_out_dir(slug) -> ~/Videos/WCP Reels/<slug>.
  CLI: `python reelkit.py intake "<drive folder>" <slug>`.
"""
import math
import os
import sys
import random
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps
import imageio_ffmpeg
import pillow_heif

pillow_heif.register_heif_opener()

# ---------- constants ----------
W, H, FPS = 1080, 1920, 30
SR = 48000

NAVY = (1, 69, 126); SKY = (64, 170, 237); ORANGE = (255, 140, 0)
AMBER = (255, 163, 52); GREEN = (34, 197, 94); WHITE = (255, 255, 255)
CREAM = (255, 246, 230); GREENINK = (14, 123, 46)

CLASS_COLORS = {"twos": AMBER, "threes": GREEN, "prek-am": ORANGE, "prek-pm": SKY, "summer": NAVY}


def ffmpeg():
    return imageio_ffmpeg.get_ffmpeg_exe()


# ---------- fonts ----------
_FONT_WOFF2 = {"bold": "captain-comic-bold.woff2", "regular": "captain-comic-regular.woff2"}
_font_ttf_paths = {}
_font_obj_cache = {}


def _repo_root():
    # this file lives at <repo>/social/reelkit/reelkit.py
    return Path(__file__).resolve().parents[2]


def _font_cache_dir():
    base = os.environ.get("LOCALAPPDATA") or str(Path.home())
    d = Path(base) / "wcp-reelkit" / "fonts"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _ensure_font_ttf(key):
    if key in _font_ttf_paths:
        return _font_ttf_paths[key]
    ttf_path = _font_cache_dir() / f"cc-{key}.ttf"
    if not ttf_path.exists():
        woff2_path = _repo_root() / "site" / "public" / "fonts" / _FONT_WOFF2[key]
        from fontTools.ttLib import TTFont
        tt = TTFont(str(woff2_path))
        tt.flavor = None
        tt.save(str(ttf_path))
    _font_ttf_paths[key] = ttf_path
    return ttf_path


def font(size, bold=True):
    key = "bold" if bold else "regular"
    ttf_path = _ensure_font_ttf(key)
    ck = (str(ttf_path), size)
    if ck not in _font_obj_cache:
        _font_obj_cache[ck] = ImageFont.truetype(str(ttf_path), size)
    return _font_obj_cache[ck]


# ---------- easing ----------
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def ease_out_cubic(t):
    t = clamp(t)
    return 1 - (1 - t) ** 3


def ease_in_out(t):
    t = clamp(t)
    return 3 * t * t - 2 * t * t * t


def ease_out_back(t, s=1.9):
    t = clamp(t)
    t -= 1
    return t * t * ((s + 1) * t + s) + 1


def pop(t, t0, dur=0.28):
    """scale for a pop-in starting at t0"""
    return 0 if t < t0 else ease_out_back((t - t0) / dur)


def shake(t, t0, amp=26, dur=0.35):
    if t < t0 or t > t0 + dur:
        return 0, 0
    k = 1 - (t - t0) / dur
    return amp * k * math.sin((t - t0) * 90), amp * k * math.cos((t - t0) * 71)


# ---------- paper ----------
_paper_rng = None
_paper_cache = {}


def paper(color, seed=7):
    """Textured full-frame background in `color`. Cached per color; draws
    sequentially from a shared generator seeded on first call (matches the
    original single-rng behavior when colors are requested in a fixed order)."""
    global _paper_rng
    key = tuple(color)
    if key in _paper_cache:
        return _paper_cache[key]
    if _paper_rng is None:
        _paper_rng = np.random.default_rng(seed)
    rng = _paper_rng
    base = np.ones((H, W, 3), np.float32) * np.array(color, np.float32)
    n = rng.normal(0, 1, (H // 2, W // 2)).astype(np.float32)
    n = np.array(Image.fromarray(((n * 20) + 128).clip(0, 255).astype(np.uint8)).resize((W, H), Image.BILINEAR).filter(ImageFilter.GaussianBlur(1)), np.float32) - 128
    fib = rng.normal(0, 1, (H, W)).astype(np.float32) * 3
    base += (n * 0.35 + fib)[..., None]
    yy, xx = np.mgrid[0:H, 0:W]
    v = 1 - 0.10 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
    base *= v[..., None]
    img = Image.fromarray(base.clip(0, 255).astype(np.uint8))
    _paper_cache[key] = img
    return img


# ---------- drawing helpers ----------
def text_img(txt, size, fill, bold=True, stroke=0, stroke_fill=None, spacing=6, align="center"):
    f = font(size, bold)
    d = ImageDraw.Draw(Image.new("L", (1, 1)))
    bb = [int(math.floor(v)) if i < 2 else int(math.ceil(v)) for i, v in enumerate(d.multiline_textbbox((0, 0), txt, font=f, stroke_width=stroke, spacing=spacing, align=align))]
    pad = 8 + stroke
    im = Image.new("RGBA", (bb[2] - bb[0] + pad * 2, bb[3] - bb[1] + pad * 2), (0, 0, 0, 0))
    ImageDraw.Draw(im).multiline_text((pad - bb[0], pad - bb[1]), txt, font=f, fill=fill, stroke_width=stroke,
                                      stroke_fill=stroke_fill, spacing=spacing, align=align)
    return im


def sticker(txt, size, fg=NAVY, bg=WHITE, padx=34, pady=20, radius=22, bold=True, shadow=True, check=False):
    t = text_img(txt, size, fg, bold)
    cw = int(size * 0.9) if check else 0
    w, h = int(t.width + padx * 2 + cw), int(t.height + pady * 2)
    im = Image.new("RGBA", (w + 24, h + 28), (0, 0, 0, 0))
    if shadow:
        sh = Image.new("RGBA", im.size, (0, 0, 0, 0))
        ImageDraw.Draw(sh).rounded_rectangle((8, 14, 8 + w, 14 + h), radius, fill=(0, 0, 0, 90))
        im = Image.alpha_composite(im, sh.filter(ImageFilter.GaussianBlur(7)))
    ImageDraw.Draw(im).rounded_rectangle((0, 0, w, h), radius, fill=bg + (255,))
    im.alpha_composite(t, (int(padx + cw), int(pady)))
    if check:
        d = ImageDraw.Draw(im)
        cx, cy, s = padx + cw * 0.38, h / 2 + 2, size * 0.34
        d.line([(cx - s, cy), (cx - s * 0.25, cy + s * 0.75), (cx + s * 1.05, cy - s * 0.85)], fill=GREENINK, width=max(6, size // 7), joint="curve")
    return im


def place(base, img, cx, cy, scale=1.0, rot=0.0, alpha=1.0):
    if alpha <= 0 or scale <= 0.01:
        return
    im = img
    if scale != 1.0:
        im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.BICUBIC)
    if rot:
        im = im.rotate(rot, Image.BICUBIC, expand=True)
    if alpha < 1:
        a = im.getchannel("A").point(lambda p: int(p * alpha))
        im = im.copy()
        im.putalpha(a)
    base.alpha_composite(im, (int(cx - im.width / 2), int(cy - im.height / 2)))


def kb_crop(src, aspect, zoom, fx, fy):
    """crop of src with given aspect (w/h), zoom>=1, focus point fx,fy in 0..1"""
    sw, sh = src.size
    if sw / sh > aspect:
        ch = sh; cw = ch * aspect
    else:
        cw = sw; ch = cw / aspect
    cw /= zoom; ch /= zoom
    x = clamp(fx * sw - cw / 2, 0, sw - cw); y = clamp(fy * sh - ch / 2, 0, sh - ch)
    return (x, y, x + cw, y + ch)


def print_card(photo, iw, ih, border=22, bottom=70):
    w, h = iw + border * 2, ih + border + bottom
    card = Image.new("RGBA", (w + 60, h + 70), (0, 0, 0, 0))
    sh = Image.new("RGBA", card.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rectangle((18, 30, 18 + w, 30 + h), fill=(0, 0, 0, 110))
    card = Image.alpha_composite(card, sh.filter(ImageFilter.GaussianBlur(14)))
    ImageDraw.Draw(card).rectangle((0, 0, w, h), fill=(253, 252, 248, 255))
    card.alpha_composite(photo.convert("RGBA"), (border, border))
    return card


# ---------- photos ----------
_photo_cache = {}


def load_photo(path, long_side=1800, blur=None):
    """Open a HEIC/JPG photo (pillow_heif registered), fix EXIF orientation,
    apply blur boxes (fractions x0,y0,x1,y1 of the full-res image, e.g. to
    hide a name label) BEFORE downscaling, then thumbnail to long_side."""
    path = str(path)
    key = (path, long_side, tuple(blur) if blur else None)
    if key in _photo_cache:
        return _photo_cache[key]
    im = Image.open(path)
    im = ImageOps.exif_transpose(im).convert("RGB")
    for (x0, y0, x1, y1) in (blur or []):
        box = tuple(int(v) for v in (x0 * im.width, y0 * im.height, x1 * im.width, y1 * im.height))
        im.paste(im.crop(box).filter(ImageFilter.GaussianBlur(im.width / 120)), box[:2])
    im.thumbnail((long_side, long_side), Image.LANCZOS)
    _photo_cache[key] = im
    return im


def kb_card(src, iw, ih, zoom, fx, fy, long_side=1800, blur=None, **kw):
    """Ken-Burns crop of `src` (a path/str, or an already-loaded PIL image)
    onto a print_card of size iw x ih."""
    if isinstance(src, (str, Path)):
        src = load_photo(src, long_side=long_side, blur=blur)
    box = kb_crop(src, iw / ih, zoom, fx, fy)
    return print_card(src.resize((iw, ih), Image.LANCZOS, box=box), iw, ih, **kw)


# ---------- video ----------
def read_video_frames(path, size=(1000, 563)):
    """Decode every frame of a video, resized to `size`. Returns
    (frames, duration) where duration is frame_count / actual source fps."""
    rd = imageio_ffmpeg.read_frames(str(path))
    meta = next(rd)
    vw, vh = meta["size"]
    frames = []
    for fr in rd:
        im = Image.frombuffer("RGB", (vw, vh), fr, "raw", "RGB", 0, 1).resize(size, Image.LANCZOS)
        frames.append(im)
    src_fps = meta.get("fps") or FPS
    duration = len(frames) / src_fps
    return frames, duration


# ---------- confetti ----------
class Confetti:
    def __init__(self, n=140, seed=3, colors=None, w=W, h=H):
        self.w, self.h = w, h
        colors = colors or [ORANGE, AMBER, SKY, GREEN, WHITE, (236, 72, 153)]
        rnd = random.Random(seed)
        self.particles = [dict(
            x=rnd.uniform(0, w), y=rnd.uniform(-1900, -40), vy=rnd.uniform(380, 700), vx=rnd.uniform(-60, 60),
            r=rnd.uniform(0, 360), vr=rnd.uniform(-400, 400), c=rnd.choice(colors),
            w=rnd.uniform(14, 26), h=rnd.uniform(8, 14)) for _ in range(n)]

    def draw(self, base, t):
        d = ImageDraw.Draw(base)
        for c in self.particles:
            y = c["y"] + c["vy"] * t
            if y < -40 or y > self.h + 40:
                continue
            x = c["x"] + c["vx"] * t + 30 * math.sin(t * 3 + c["r"])
            a = math.radians(c["r"] + c["vr"] * t); ca, sa = math.cos(a), math.sin(a)
            pts = [(x + px * ca - py * sa, y + px * sa + py * ca) for px, py in
                   [(-c["w"] / 2, -c["h"] / 2), (c["w"] / 2, -c["h"] / 2), (c["w"] / 2, c["h"] / 2), (-c["w"] / 2, c["h"] / 2)]]
            d.polygon(pts, fill=c["c"])


# ---------- audio synthesis ----------
_audio_rng = np.random.default_rng(7)


def env(n, a=0.002, d=0.2):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)


def noise(n):
    return _audio_rng.normal(0, 1, n).astype(np.float32)


def hp(x, k=0.95):
    return x - np.concatenate([[0], x[:-1]]) * k


def lp(x, a=0.2):
    from scipy.signal import lfilter
    return lfilter([a], [1, -(1 - a)], x).astype(np.float32)


def s_pop():
    n = int(0.09 * SR); t = np.arange(n) / SR
    f = 500 + 1400 * t / 0.09
    return 0.5 * np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.03)


def s_ding(f0=1568):
    n = int(0.9 * SR); t = np.arange(n) / SR
    return 0.25 * (np.sin(2 * np.pi * f0 * t) + 0.4 * np.sin(2 * np.pi * f0 * 2.01 * t) + 0.2 * np.sin(2 * np.pi * f0 * 3.0 * t)) * env(n, 0.002, 0.25)


def s_tick():
    n = int(0.03 * SR)
    return 0.35 * hp(noise(n), 0.97) * env(n, 0.0005, 0.006) + 0.3 * np.sin(2 * np.pi * 1800 * np.arange(n) / SR) * env(n, 0.0005, 0.008)


def s_thud():
    n = int(0.5 * SR); t = np.arange(n) / SR
    f = 120 * np.exp(-t * 6) + 45
    return 0.9 * np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.14) + 0.35 * lp(noise(n), 0.15) * env(n, 0.001, 0.05)


def s_crash():
    n = int(1.6 * SR)
    return 0.28 * hp(noise(n), 0.9) * env(n, 0.001, 0.45)


def s_slam():
    a = s_thud(); b = s_crash()
    o = np.zeros(max(len(a), len(b)), np.float32); o[:len(a)] += a; o[:len(b)] += b
    return o


def s_whoosh():
    n = int(0.3 * SR); t = np.arange(n) / SR
    e = np.sin(np.pi * t / 0.3) ** 2
    return 0.18 * lp(noise(n), 0.08) * e * 3


def s_drumroll(dur=1.05):
    n = int(dur * SR); out = np.zeros(n, np.float32); tt = 0.0
    while tt < dur - 0.02:
        rate = 14 + 26 * (tt / dur); i = int(tt * SR); m = int(0.06 * SR)
        hit = hp(noise(m), 0.8) * env(m, 0.0005, 0.02) * (0.15 + 0.35 * tt / dur)
        out[i:i + m] += hit[:n - i]; tt += 1 / rate
    return out


def s_party():
    o = np.zeros(int(1.2 * SR), np.float32)
    for k, f in enumerate([1047, 1319, 1568, 2093]):
        d = s_ding(f) * 0.6; i = int(k * 0.07 * SR); o[i:i + len(d)] += d[:len(o) - i]
    return o


def ks(freq, dur, bright=0.5):
    """Karplus-Strong plucked string."""
    n = int(dur * SR); p = int(SR / freq)
    buf = _audio_rng.uniform(-1, 1, p).astype(np.float32)
    buf = lp(buf, bright)
    out = np.empty(n, np.float32); idx = 0
    for i in range(n):
        v = buf[idx]; nxt = buf[(idx + 1) % p]
        buf[idx] = 0.996 * 0.5 * (v + nxt); out[i] = v; idx = (idx + 1) % p
    return out * env(n, 0.001, 0.6)


def music(dur, bpm=116):
    beat = 60 / bpm; e8 = beat / 2
    NF = lambda m: 440 * 2 ** ((m - 69) / 12)
    chords = [[67, 60, 64, 72], [67, 62, 71, 69], [69, 60, 64, 69], [69, 60, 65, 69]]  # C G Am F (uke)
    roots = [48, 43, 45, 41]
    n = int(dur * SR); out = np.zeros(n + SR * 2, np.float32)
    cache = {}

    def note(m, d=1.0, b=0.5):
        k = (m, d, b)
        if k not in cache:
            cache[k] = ks(NF(m), d, b)
        return cache[k]

    pattern = [(0, 1, 1.0), (1, 1, 0.7), (2, 0, 0.5), (3, 0, 0.6), (4, 1, 0.8), (5, 0, 0.55), (6, 1, 0.7), (7, 0, 0.5)]
    bar = 0; t = 0.0
    while t < dur:
        ch = chords[bar % 4]
        for step, down, vel in pattern:
            st = t + step * e8
            if st >= dur:
                break
            order = ch if down else ch[::-1]
            for j, m in enumerate(order):
                i = int((st + j * 0.012) * SR); s = note(m, 0.9, 0.55 if down else 0.7) * vel * 0.16
                out[i:i + len(s)] += s
            # shaker
            i = int(st * SR); m_ = int(0.05 * SR)
            out[i:i + m_] += hp(noise(m_), 0.98) * env(m_, 0.004, 0.012) * 0.05
        # bass
        for bt in (0, 2):
            st = t + bt * beat; i = int(st * SR); nn = int(beat * 1.6 * SR); tt_ = np.arange(nn) / SR
            out[i:i + nn] += 0.22 * np.sin(2 * np.pi * NF(roots[bar % 4]) * tt_) * env(nn, 0.005, 0.35)
        # claps 2 & 4
        for bt in (1, 3):
            i = int((t + bt * beat) * SR); m_ = int(0.12 * SR)
            out[i:i + m_] += lp(hp(noise(m_), 0.9), 0.5) * env(m_, 0.001, 0.035) * 0.16
        # glock melody on bar downbeats
        mel = [79, 83, 81, 77][bar % 4]
        for k2, (off, mm) in enumerate([(0, mel), (1.5 * beat, mel - 3), (3 * beat, mel + 2)]):
            i = int((t + off) * SR); d = s_ding(NF(mm)) * 0.22; out[i:i + len(d)] += d
        t += 4 * beat; bar += 1
    out = out[:n]
    f = int(1.5 * SR); out[-f:] *= np.linspace(1, 0, f)
    fi = int(0.05 * SR); out[:fi] *= np.linspace(0, 1, fi)
    return out


def build_audio(total, sfx, dialogue_path=None, dialogue_stream="0:0", music_start=None, work_dir=None):
    """Mix dialogue (extracted from `dialogue_path` if given) + sfx list
    [(time, kind), ...] + optional music starting at `music_start`."""
    n = int((total + 0.2) * SR); mix = np.zeros(n, np.float32)
    if dialogue_path:
        work_dir = Path(work_dir) if work_dir else Path(tempfile.mkdtemp())
        raw = work_dir / "dlg.raw"
        subprocess.run([ffmpeg(), "-v", "error", "-y", "-i", str(dialogue_path), "-map", dialogue_stream,
                        "-ac", "1", "-ar", str(SR), "-f", "f32le", str(raw)], check=True)
        dlg = np.fromfile(str(raw), np.float32)
        dlg = dlg / (np.abs(dlg).max() + 1e-6) * 0.9
        fo = int(0.15 * SR); dlg[-fo:] *= np.linspace(1, 0, fo)
        mix[:len(dlg)] += dlg
    gen = dict(pop=s_pop, ding=s_ding, tick=s_tick, stamp=s_thud, slam=s_slam, whoosh=s_whoosh, drumroll=s_drumroll, party=s_party)
    for tm, kind in sfx:
        s = gen[kind](); i = int(tm * SR); L = min(len(s), n - i); mix[i:i + L] += s[:L] * 0.8
    if music_start is not None:
        m = music(total - music_start + 0.1); i = int(music_start * SR); L = min(len(m), n - i)
        mix[i:i + L] += m[:L] * 0.9
    mix = mix / (np.abs(mix).max() + 1e-6) * 0.89
    return mix


# ---------- timeline ----------
class Timeline:
    """Ordered (name, duration) segments -> {name: (start, end)} + .total."""

    def __init__(self, segments):
        self.segments = {}
        t = 0.0
        for name, dur in segments:
            self.segments[name] = (t, t + dur)
            t += dur
        self.total = t

    def __getitem__(self, name):
        return self.segments[name]

    def __contains__(self, name):
        return name in self.segments

    def segment_at(self, t):
        """Return (name, local_time). Past the end, clamps to the last segment."""
        for name, (a, b) in self.segments.items():
            if a <= t < b:
                return name, t - a
        name, (a, b) = list(self.segments.items())[-1]
        return name, t - a


# ---------- render / preview ----------
def render(frame_fn, total, out_dir, slug, sfx, dialogue_path=None, music_start=None):
    """Render frame_fn(t) for t in [0, total) to <out_dir>/<slug>-music.mp4
    and <slug>-nomusic.mp4 (H.264 CRF17 yuv420p video, loudnorm AAC 192k
    stereo audio, +faststart). Intermediates land in <out_dir>/_work/."""
    out_dir = Path(out_dir)
    work = out_dir / "_work"
    work.mkdir(parents=True, exist_ok=True)
    video_only = work / "video_only.mp4"
    wr = imageio_ffmpeg.write_frames(str(video_only), (W, H), fps=FPS, codec="libx264", quality=None,
                                     output_params=["-crf", "17", "-preset", "medium", "-pix_fmt", "yuv420p"], macro_block_size=1)
    wr.send(None)
    nf = int(round(total * FPS))
    for i in range(nf):
        wr.send(frame_fn(i / FPS).convert("RGB").tobytes())
        if i % 60 == 0:
            print(f"frame {i}/{nf}", flush=True)
    wr.close()
    outputs = {}
    for tag, ms in [("music", music_start), ("nomusic", None)]:
        a = build_audio(total, sfx, dialogue_path=dialogue_path, music_start=ms, work_dir=work)
        raw = work / f"aud_{tag}.raw"
        a.astype(np.float32).tofile(str(raw))
        out_path = out_dir / f"{slug}-{tag}.mp4"
        subprocess.run([ffmpeg(), "-v", "error", "-y", "-i", str(video_only), "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", str(raw),
                        "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000",
                        "-c:a", "aac", "-b:a", "192k", "-ac", "2", "-shortest", "-movflags", "+faststart",
                        str(out_path)], check=True)
        outputs[tag] = out_path
        print("wrote", tag)
    return outputs


def preview(frame_fn, times, out_dir):
    """Write stills for each t in `times` plus one 7-col contact sheet.
    Returns the contact sheet path."""
    out_dir = Path(out_dir)
    stills_dir = out_dir / "_work" / "stills"
    stills_dir.mkdir(parents=True, exist_ok=True)
    paths = []
    for tm in times:
        p = stills_dir / f"{tm:06.2f}.jpg"
        frame_fn(tm).convert("RGB").save(p, quality=85)
        paths.append(p)
    sheet_path = out_dir / "_work" / "contact_sheet.jpg"
    contact_sheet(paths, sheet_path, tile=(270, 480), cols=7)
    return sheet_path


def contact_sheet(paths, out, tile=(360, 420), cols=4):
    paths = list(paths)
    if not paths:
        raise ValueError("contact_sheet: no paths given")
    rows = math.ceil(len(paths) / cols)
    tw, th = tile
    sheet = Image.new("RGB", (tw * cols, th * rows), (30, 30, 30))
    fnt = ImageFont.load_default()
    d = ImageDraw.Draw(sheet)
    for i, p in enumerate(paths):
        im = Image.open(p)
        im = ImageOps.exif_transpose(im).convert("RGB")
        im.thumbnail((tw - 8, th - 24), Image.LANCZOS)
        cx, cy = (i % cols) * tw, (i // cols) * th
        x = cx + (tw - im.width) // 2
        y = cy + (th - 24 - im.height) // 2
        sheet.paste(im, (x, y))
        d.text((cx + 6, cy + th - 20), Path(p).name, fill=(255, 255, 255), font=fnt)
    out = Path(out)
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out, quality=88)
    return out


# ---------- transcription ----------
def transcribe(video_path, model="small"):
    """Force CPU/int8 (the GPU path fails: missing cublas64_12.dll).
    Returns [(start, end, text), ...] and prints word timestamps."""
    os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")
    from faster_whisper import WhisperModel
    m = WhisperModel(model, device="cpu", compute_type="int8")
    segments, info = m.transcribe(str(video_path), word_timestamps=True)
    out = []
    for seg in segments:
        print(f"[{seg.start:.2f}-{seg.end:.2f}] {seg.text}")
        if seg.words:
            for w in seg.words:
                print(f"    {w.start:.2f}-{w.end:.2f} {w.word}")
        out.append((seg.start, seg.end, seg.text))
    return out


def default_out_dir(slug):
    return Path.home() / "Videos" / "WCP Reels" / slug


# ---------- CLI ----------
def _cli_intake(drive_folder, slug):
    drive = Path(drive_folder)
    out = default_out_dir(slug) / "_work"
    prev_dir = out / "prev"
    prev_dir.mkdir(parents=True, exist_ok=True)

    photos = sorted(p for p in drive.iterdir() if p.suffix.lower() in (".heic", ".jpg", ".jpeg"))
    prev_paths = []
    for p in photos:
        im = load_photo(p, long_side=700)
        outp = prev_dir / f"{p.stem}.jpg"
        im.save(outp, quality=85)
        prev_paths.append(outp)
        print("preview:", outp)
    photo_sheet = None
    if prev_paths:
        photo_sheet = contact_sheet(prev_paths, out / "photo_sheet.jpg", tile=(360, 420), cols=4)
        print("photo sheet:", photo_sheet)

    videos = sorted(p for p in drive.iterdir() if p.suffix.lower() in (".mov", ".mp4"))
    results = []
    for v in videos:
        print("reading video:", v.name)
        frames, dur = read_video_frames(v, size=(320, 180))
        src_fps = max(1, round(len(frames) / dur)) if dur else FPS
        step = max(1, round(src_fps / 2))  # 2fps sample
        sampled = frames[::step][:20]  # 4x5 grid
        sheet_path = out / f"{v.stem}_frames.jpg"
        tmp_paths = []
        tmp_dir = out / f"{v.stem}_tmp"
        tmp_dir.mkdir(parents=True, exist_ok=True)
        for i, fr in enumerate(sampled):
            tp = tmp_dir / f"{i:02d}.jpg"
            fr.save(tp, quality=80)
            tmp_paths.append(tp)
        contact_sheet(tmp_paths, sheet_path, tile=(320, 180 + 24), cols=5)
        for tp in tmp_paths:
            tp.unlink()
        tmp_dir.rmdir()

        summary_path = out / f"{v.stem}_stream.txt"
        summary_path.write_text(
            f"file: {v}\nframes_decoded: {len(frames)}\nduration_s: {dur:.3f}\n"
            f"approx_source_fps: {src_fps}\nresized_for_sheet: 320x180 sampled every {step} frames\n",
            encoding="utf-8")

        print("transcribing:", v.name)
        transcript = transcribe(v)
        transcript_path = out / f"{v.stem}_transcript.txt"
        with open(transcript_path, "w", encoding="utf-8") as f:
            for start, end, text in transcript:
                f.write(f"[{start:.2f}-{end:.2f}] {text.strip()}\n")
        results.append(dict(video=v, frame_sheet=sheet_path, summary=summary_path, transcript=transcript_path))

    print("\n--- intake summary ---")
    print("previews:", prev_dir)
    if photo_sheet:
        print("photo sheet:", photo_sheet)
    for r in results:
        print(f"video: {r['video']}")
        print(f"  frame sheet: {r['frame_sheet']}")
        print(f"  stream summary: {r['summary']}")
        print(f"  transcript: {r['transcript']}")
    return dict(prev_dir=prev_dir, photo_sheet=photo_sheet, videos=results)


if __name__ == "__main__":
    if len(sys.argv) >= 4 and sys.argv[1] == "intake":
        _cli_intake(sys.argv[2], sys.argv[3])
    else:
        print("usage: python reelkit.py intake \"<drive folder>\" <slug>")
        sys.exit(1)


# ---------------------------------------------------------------------------
# Tracked video blur (children's names on bins/cubbies inside VIDEO frames)
# ---------------------------------------------------------------------------
def blur_video_region(src, dst, box, ref_frame=0, track_mask=None, check_path=None, crf=12):
    """Blur a region of a handheld video that follows the camera.

    box: polygon [(x, y), ...] in SOURCE pixels, drawn on frame `ref_frame`.
         It may run past the frame edge to cover things revealed by a pan.
    track_mask: (y0, y1, x0, x1) source-pixel window of STATIC scenery (walls,
         shelves) used to track camera motion; RANSAC rejects moving kids.
         Default: the whole frame.
    Writes a full-resolution, silent H.264 file to `dst` (audio stays in `src`;
    pass `src` as the dialogue source). Writes a verification sheet (every 20th
    frame, cropped around the box) to `check_path`. LOOK at it before use.
    Returns the minimum RANSAC inlier count (low numbers mean shaky tracking).
    """
    import cv2
    cap = cv2.VideoCapture(str(src)); frames = []
    while True:
        ok, f = cap.read()
        if not ok: break
        frames.append(f)
    h, w = frames[0].shape[:2]
    orb = cv2.ORB_create(3000); bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)

    def feats(f):
        g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY)
        m = None
        if track_mask:
            y0, y1, x0, x1 = track_mask; m = np.zeros_like(g); m[y0:y1, x0:x1] = 255
        return orb.detectAndCompute(g, m)

    kr, dr = feats(frames[ref_frame]); poly = np.float32(box)
    proc = subprocess.Popen([ffmpeg(), "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{w}x{h}",
                             "-r", "30", "-i", "-", "-c:v", "libx264", "-crf", str(crf), "-preset", "slow",
                             "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(dst)], stdin=subprocess.PIPE)
    xs = [p[0] for p in box]; ys = [p[1] for p in box]
    cy0, cy1 = max(0, int(min(ys)) - 120), min(h, int(max(ys)) + 120)
    cx0, cx1 = max(0, int(min(xs)) - 120), min(w, int(max(xs)) + 360)
    checks, min_inl = [], 10 ** 9
    for i, f in enumerate(frames):
        k, d = feats(f)
        ms = sorted(bf.match(dr, d), key=lambda m: m.distance)[:400]
        M, inl = cv2.estimateAffinePartial2D(np.float32([kr[m.queryIdx].pt for m in ms]),
                                             np.float32([k[m.trainIdx].pt for m in ms]),
                                             method=cv2.RANSAC, ransacReprojThreshold=3)
        min_inl = min(min_inl, int(inl.sum()))
        pts = cv2.transform(poly[None], M)[0]
        mask = np.zeros((h, w), np.uint8); cv2.fillPoly(mask, [np.int32(pts.round())], 255)
        mask = cv2.dilate(mask, np.ones((9, 9), np.uint8))
        a = cv2.GaussianBlur(mask, (0, 0), 5).astype(np.float32)[..., None] / 255
        f = (f * (1 - a) + cv2.GaussianBlur(f, (0, 0), 18) * a).astype(np.uint8)
        proc.stdin.write(f.tobytes())
        if i % 20 == 0 or i == len(frames) - 1:
            t = f[cy0:cy1, cx0:cx1].copy(); cv2.putText(t, str(i), (10, 40), 0, 1.2, (255, 255, 255), 3); checks.append(t)
    proc.stdin.close(); proc.wait()
    if check_path:
        while len(checks) % 4: checks.append(np.zeros_like(checks[0]))
        sheet = np.vstack([np.hstack(checks[j:j + 4]) for j in range(0, len(checks), 4)])
        Path(check_path).parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(str(check_path), cv2.resize(sheet, None, fx=0.6, fy=0.6))
    return min_inl
