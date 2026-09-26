"""One Pump reel: Pre-K PM hand-washing. Renders 1080x1920 frames + synthesized
audio on top of reelkit. Creative content only — all reusable rendering,
audio-synthesis, and CLI machinery lives in reelkit.py."""
import math
import os
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "reelkit"))
import reelkit as rk  # noqa: E402

SRC_DIR = Path(r"I:\Shared drives\WCP Publicity\Photography\26-27\Pre-K PM")
VID = SRC_DIR / "IMG_9194.MOV"
LOGO = Path(r"C:\Users\natha\Documents\Claude\Projects\West Chester Preschool Website\site\src\assets\brand\wcp-logo-white.png")
SLUG = "2026-09-25-one-pump"

W, H, FPS = rk.W, rk.H, rk.FPS
NAVY, SKY, ORANGE, AMBER, GREEN, WHITE, CREAM, GREENINK = rk.NAVY, rk.SKY, rk.ORANGE, rk.AMBER, rk.GREEN, rk.WHITE, rk.CREAM, rk.GREENINK
clamp, ease_out_cubic, ease_in_out, ease_out_back = rk.clamp, rk.ease_out_cubic, rk.ease_in_out, rk.ease_out_back
pop, shake = rk.pop, rk.shake
text_img, sticker, place, print_card, kb_crop, kb_card = rk.text_img, rk.sticker, rk.place, rk.print_card, rk.kb_crop, rk.kb_card

PREVIEW = "--preview" in sys.argv

BLUR = {"IMG_9195": [(0.545, 0.24, 0.872, 0.345), (0.9, 0.268, 0.935, 0.292)],
        "IMG_9237": [(0.08, 0.80, 0.18, 0.88)]}


def photo(name, long_side=1800):
    """Resolve a Pre-K PM source photo by stem, whatever its real extension
    is (HEIC or JPG), with the name-label blur applied if this stem needs it."""
    for ext in (".heic", ".HEIC", ".jpg", ".JPG", ".jpeg", ".JPEG"):
        p = SRC_DIR / f"{name}{ext}"
        if p.exists():
            return rk.load_photo(p, long_side=long_side, blur=BLUR.get(name))
    raise FileNotFoundError(f"no source photo for {name} in {SRC_DIR}")


# ---------- paper backgrounds (order matters: shares reelkit's paper rng) ----------
PAPER = {k: rk.paper(c) for k, c in dict(sky=SKY, navy=NAVY, amber=AMBER, cream=CREAM).items()}

# ---------- video ----------
# Storage bins on the left shelf of the clip carry children's first names.
# The first posted version (2026-09-26) missed them: only the PHOTOS were
# blurred. Box = source px on frame 100, tracked against the static shelf/wall.
VIDEO_BLUR_BOX = [(-300, 354), (276, 354), (276, 530), (-300, 530)]
_work = rk.default_out_dir(SLUG) / "_work"; _work.mkdir(parents=True, exist_ok=True)
VID_BLURRED = _work / "IMG_9194-blurred.mp4"
if not VID_BLURRED.exists():
    print("blurring name labels in video...")
    inl = rk.blur_video_region(VID, VID_BLURRED, VIDEO_BLUR_BOX, ref_frame=100,
                               track_mask=(0, 620, 0, 900), check_path=_work / "video_blur_check.jpg")
    print("min RANSAC inliers", inl, "- check", _work / "video_blur_check.jpg")
print("reading video...")
VFR, V_END = rk.read_video_frames(VID_BLURRED, size=(1000, 563))
print(len(VFR), "frames", V_END)

# ---------- timeline ----------
TL = rk.Timeline([("video", V_END), ("freeze", 1.15), ("one", 1.6), ("p1", 2.8), ("p2", 3.6),
                  ("counter", 3.4), ("montage", 1.5 * 3 + 2.3), ("end", 3.4)])
T = TL.segments
TOTAL = TL.total
print("total", TOTAL)

SFX = []


def sfx(tm, kind):
    SFX.append((tm, kind))


CAPS = [(0.0, 1.25, "Does that make them clean?"), (1.25, 2.35, "Are they clean now?"),
        (3.0, 4.35, "No, they're not clean."), (4.35, 5.5, "We need something else..."),
        (5.5, 7.25, "Special ingredient..."), (7.25, 99, "So... how many times?")]
cap_imgs = {c[2]: sticker(c[2], 62) for c in CAPS}
hdr_chip = sticker("PRE-K PM", 44, fg=WHITE, bg=NAVY, padx=26, pady=14, radius=16)
hdr_title = text_img("Hand-washing 101", 100, NAVY)
hdr_sub = text_img("(harder than it looks)", 50, NAVY, bold=False)
no_st = sticker("NO!", 130, fg=NAVY, bg=AMBER, padx=40, pady=18)
drum_st = sticker("drumroll please...", 56, fg=NAVY, bg=AMBER)

one_big = text_img("ONE.", 360, NAVY)
one_sub = text_img("pump. just one.", 86, NAVY)

p1_head = sticker("One pump.", 108)
p1_chip = sticker("pumps used: 1 of 1", 52, check=True)
p2_head = sticker("The whole class,\nsupervising.", 78)
p2_head2 = sticker("Required reading:", 78, bg=AMBER)

cn_head = text_img("Pumps our friends\nwanted:", 92, WHITE)
CN_SEQ = [(0.25, "1"), (0.55, "2"), (0.8, "3"), (1.0, "5"), (1.15, "8"), (1.28, "12"), (1.4, "20"),
          (1.5, "35"), (1.6, "60"), (1.72, "99+")]
cn_nums = {v: text_img(v, 400, AMBER) for _, v in CN_SEQ}
_st = text_img("PUMPS ALLOWED: 1", 84, ORANGE)
_sw, _sh = _st.width + 80, _st.height + 60
stamp = Image.new("RGBA", (_sw, _sh), (0, 0, 0, 0))
from PIL import ImageDraw as _ImageDraw  # noqa: E402
_d = _ImageDraw.Draw(stamp)
_d.rounded_rectangle((6, 6, _sw - 6, _sh - 6), 26, outline=ORANGE, width=14)
stamp.alpha_composite(_st, ((_sw - _st.width) // 2, (_sh - _st.height) // 2))

mt_head = text_img("Clean hands,\nready for:", 100, NAVY)
MONT = [  # name, portrait?, label, rot, dx, focus
    ("IMG_9245", True, "play-doh", -4, -22, (0.4, 0.45)),
    ("IMG_9203", True, "painting", 3.5, 26, (0.45, 0.5)),
    ("IMG_9204", False, "race tracks", -2.5, -10, (0.5, 0.5)),
    ("IMG_9237", False, "dance party!", 3, 14, (0.5, 0.55)),
]
mt_labels = [sticker(m[2], 70, check=True) for m in MONT]

logo = Image.open(LOGO).convert("RGBA")
logo = logo.crop(logo.getbbox())
logo.thumbnail((860, 860), Image.LANCZOS)
end_1 = text_img("Wash well, friends.", 92, AMBER)
end_2 = text_img("Love, Pre-K PM", 62, WHITE, bold=False)

CONFETTI = rk.Confetti(seed=3)

# ---------- sfx schedule ----------
t0 = T["video"][0]; sfx(2.38, "pop")
t0 = T["freeze"][0]; sfx(t0 + 0.1, "pop"); sfx(t0 + 0.12, "drumroll")
t0 = T["one"][0]; sfx(t0, "slam"); sfx(t0 + 0.45, "pop")
t0 = T["p1"][0]; sfx(t0 + 0.2, "pop"); sfx(t0 + 1.2, "ding")
t0 = T["p2"][0]; sfx(t0 + 0.2, "pop"); sfx(t0 + 1.5, "whoosh"); sfx(t0 + 2.0, "pop")
t0 = T["counter"][0]
for tt, _ in CN_SEQ:
    sfx(t0 + tt, "tick")
sfx(t0 + 2.0, "stamp")
t0 = T["montage"][0]; sfx(t0 + 0.05, "pop")
for i in range(4):
    sfx(t0 + 0.25 + i * 1.5, "whoosh"); sfx(t0 + 0.55 + i * 1.5, "ding" if i < 3 else "party")
t0 = T["end"][0]; sfx(t0 + 0.55, "pop"); sfx(t0 + 1.0, "pop")

CARD_CACHE = {}


def frame(t):
    seg, lt = TL.segment_at(t) if t < TOTAL else ("end", t - T["end"][0])
    a, b = T[seg]

    if seg in ("video", "freeze"):
        base = PAPER["sky"].copy().convert("RGBA")
        if seg == "video":
            vi = VFR[min(len(VFR) - 1, int(lt * FPS))]; zoom = 1.0
        else:
            vi = VFR[-1]; zoom = 1.0 + 0.06 * ease_in_out(lt / 1.15)
        card = print_card(vi, 1000, 563, border=18, bottom=18)
        place(base, card, 540 + 14, 1010, zoom, -2)
        place(base, hdr_chip, 540, 330, 1, 3)
        place(base, hdr_title, 540, 450)
        place(base, hdr_sub, 540, 545)
        if 2.35 <= t < 3.7:
            place(base, no_st, 210, 740, pop(t, 2.35, 0.22), -8)
        cap = next((c for c in CAPS if c[0] <= t < c[1]), None)
        if cap:
            place(base, cap_imgs[cap[2]], 540, 1420, min(1, 0.85 + 0.15 * pop(t, cap[0], 0.2)), -1.5)
        if seg == "freeze":
            place(base, drum_st, 700, 1600, pop(lt, 0.1), 5)
        return base

    if seg == "one":
        base = PAPER["amber"].copy().convert("RGBA")
        dx, dy = shake(lt, 0.12, 34, 0.4)
        s = 1 + 1.3 * (1 - ease_out_cubic(lt / 0.14)) if lt < 0.14 else 1
        place(base, one_big, 540 + dx, 880 + dy, s, -4)
        place(base, one_sub, 540 + dx, 1230 + dy, pop(lt, 0.45), 2)
        return base

    if seg == "p1":
        base = PAPER["sky"].copy().convert("RGBA")
        z = 1.0 + 0.2 * ease_in_out(lt / 2.8)
        card = kb_card(photo("IMG_9196"), 860, 1147, z, 0.33 - 0.06 * ease_in_out(lt / 2.8), 0.5 + 0.05 * ease_in_out(lt / 2.8))
        drop = ease_out_cubic(lt / 0.35)
        place(base, card, 540, 1190 - 160 * (1 - drop), 1, -3, drop)
        place(base, p1_head, 540, 400, pop(lt, 0.2), -3)
        place(base, p1_chip, 640, 1650, pop(lt, 1.2), 4)
        return base

    if seg == "p2":
        base = PAPER["sky"].copy().convert("RGBA")
        k = ease_in_out((lt - 1.4) / 0.9)
        z = 1.0 + 0.04 * clamp(lt / 1.4) + 2.1 * k
        fx = 0.5 + (0.675 - 0.5) * k; fy = 0.5 + (0.135 - 0.5) * k
        card = kb_card(photo("IMG_9195", long_side=4200), 860, 1147, z, fx, fy)
        drop = ease_out_cubic(lt / 0.35)
        place(base, card, 540, 1190 - 160 * (1 - drop), 1, 2.5, drop)
        if lt < 1.5:
            place(base, p2_head, 540, 420, pop(lt, 0.2), -2)
        else:
            place(base, p2_head2, 540, 420, pop(lt, 2.0 - 0.05), -2)
        return base

    if seg == "counter":
        base = PAPER["navy"].copy().convert("RGBA")
        dx, dy = shake(lt, 2.0, 30, 0.4)
        place(base, cn_head, 540 + dx, 520 + dy)
        cur = None
        for tt, v in CN_SEQ:
            if lt >= tt:
                cur = (tt, v)
        if cur:
            place(base, cn_nums[cur[1]], 540 + dx, 930 + dy, 0.8 + 0.2 * ease_out_cubic((lt - cur[0]) / 0.08))
        if lt >= 1.85:
            ss = 1 + 0.9 * (1 - ease_out_cubic((lt - 1.85) / 0.15))
            place(base, stamp, 540 + dx, 1330 + dy, ss, -8, clamp((lt - 1.85) / 0.06))
        return base

    if seg == "montage":
        base = PAPER["cream"].copy().convert("RGBA")
        place(base, mt_head, 540, 400, pop(lt, 0.05))
        for i, (name, portrait, label, rot, dxo, (fx, fy)) in enumerate(MONT):
            st = 0.25 + i * 1.5
            if lt < st:
                break
            if name not in CARD_CACHE:
                CARD_CACHE[name] = kb_card(photo(name), 820, 1093, 1.0, fx, fy) if portrait else kb_card(photo(name), 940, 705, 1.0, fx, fy)
            cy = 1200 if portrait else 1130
            p = ease_out_back((lt - st) / 0.38, 1.3)
            place(base, CARD_CACHE[name], 540 + dxo, cy - 700 * (1 - p), 1, rot + 10 * (1 - p))
            if i == len(MONT) - 1 or lt < st + 1.5:
                ly = (cy + 1093 / 2 + 10) if portrait else (cy + 705 / 2 + 60)
                place(base, mt_labels[i], 540 - dxo * 2, min(ly, 1760), pop(lt, st + 0.3), -rot * 1.2)
        if lt > 0.25 + 3 * 1.5:
            CONFETTI.draw(base, lt - (0.25 + 3 * 1.5 + 0.2))
        return base

    # end
    base = PAPER["navy"].copy().convert("RGBA")
    place(base, logo, 540, 820, 0.85 + 0.15 * ease_out_back(lt / 0.5, 1.4), 0, clamp(lt / 0.3))
    place(base, end_1, 540, 1240, pop(lt, 0.55), -2)
    place(base, end_2, 540, 1360, pop(lt, 1.0))
    CONFETTI.draw(base, lt + T["end"][0] - (T["montage"][0] + 0.25 + 3 * 1.5 + 0.2))
    return base


if __name__ == "__main__":
    out_dir = rk.default_out_dir(SLUG)
    out_dir.mkdir(parents=True, exist_ok=True)
    if PREVIEW:
        times = [0.5, 2.6, 6.0, 9.8, T["one"][0] + 0.8, T["p1"][0] + 2.0, T["p2"][0] + 0.9, T["p2"][0] + 3.2,
                 T["counter"][0] + 2.6, T["montage"][0] + 1.4, T["montage"][0] + 4.5, T["montage"][0] + 6.5, T["end"][0] + 2.0]
        sheet = rk.preview(frame, times, out_dir)
        print("stills done ->", out_dir / "_work" / "stills")
        print("contact sheet ->", sheet)
        sys.exit()

    music_start = T["one"][0] + 0.05
    outputs = rk.render(frame, TOTAL, out_dir, SLUG, SFX, dialogue_path=VID, music_start=music_start)
    for tag, path in outputs.items():
        print(tag, "->", path)
