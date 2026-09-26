"""facesheet.py -- a "face check sheet" for photo-release compliance.

Purpose: some children at WCP have no photo release. Before a draft reel or
post goes out, a human (Nathan, or a class rep) needs to see every face that
appears in the chosen photos and video, tick the ones that must not be shown,
and get exactly those faces blurred -- including as they move through video.

HARD CONSTRAINT: this module does face DETECTION and spatial TRACKING only.
It never compares a face in one photo/frame against a face in another photo
or video to decide whether they are the "same person" across sources -- no
embeddings, no recognition, no identity matching, anywhere in this file.
The only "linking across time" it ever does is following one face's motion
within a single continuous video via box IoU / center-distance heuristics on
consecutive sampled frames, which is spatial tracking, not identification.
People do the recognizing: every id (P1, P2, ... / V1, V2, ...) is just a
number on a face crop for a human to look at and say "that one, blur it".

API:
    build(sources, out_dir, video_fps=4, min_conf=0.6) -> dict
        sources: list of photo/video paths (or folders containing them).
        Detects faces in every photo (at two scales, to catch small faces)
        and, for every video, samples frames at `video_fps` and links
        per-video detections into tracks by IoU / center-distance (allowing
        up to ~3 missed samples). Writes faces.json, face_sheet.jpg (a
        numbered grid of face crops + context thumbnails), and
        face_sheet.html (checkboxes + a "copy selected ids" box) into
        `out_dir`. Prints a summary. Returns {"faces_json":.., "sheet":..,
        "html":.., "n_photo_faces":.., "n_video_tracks":..}.

    blur_plan(faces_json, ids) -> dict
        {"photos": {stem: [padded fractional boxes]}, "videos": {source_path:
        [track_ids]}}. Photo boxes are padded ~25% and ready to pass straight
        to reelkit.load_photo(path, blur=boxes).

    blur_video_faces(src, dst, faces_json, track_ids, check_path) -> dict
        Re-detects faces on EVERY frame of `src`, follows each track in
        `track_ids` frame-by-frame (seeded from its stored sampled boxes,
        holding/interpolating through gaps up to ~0.5s), blurs each with a
        padded feathered ellipse, writes a full-res silent H.264 (CRF 12) to
        `dst`, and a check sheet (every 10th frame) to `check_path`. Returns
        per-track coverage stats.

CLI:
    python facesheet.py build <out_dir> <file-or-folder>...
    python facesheet.py blur <faces.json> <id,id,...> <out_dir>

Known limits (be specific with Nathan about these):
  - A face turned near-fully away from the camera, or badly motion-blurred,
    will not be detected in that frame; a video track then either holds the
    last known box (drifts if the child also moved) or drops out for that
    stretch. Sampling at video_fps means a face that only appears BETWEEN
    samples in `build()` can be missed entirely at the check-sheet stage
    (this is why `blur_video_faces` re-detects every frame instead of only
    the sampled ones).
  - Fast whip pans, extreme lighting (backlit windows, deep shadow), or a
    face smaller than roughly 3% of the frame can go undetected.
  - Two children's faces overlapping/occluding each other can merge into one
    detection or cause a track to jump from one child to the other; a human
    must catch this by eye on the check sheet, since this module has no way
    to tell the two apart.
  - `min_conf` trades false negatives for false positives (stuffed animals,
    rug patterns, dolls); tune per batch and re-check the sheet.
"""
from __future__ import annotations

import base64
import io
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps

sys.path.insert(0, str(Path(__file__).resolve().parent))
import vision  # noqa: E402  (sibling module; face DETECTION only, see its docstring)
from reelkit import ffmpeg  # noqa: E402  (only helper reused from reelkit.py)

IMAGE_EXTS = {".heic", ".jpg", ".jpeg", ".png"}
VIDEO_EXTS = {".mov", ".mp4"}


# ---------------------------------------------------------------------------
# small geometry helpers (all boxes are fractional (x0,y0,x1,y1) of the
# image/frame they came from)
# ---------------------------------------------------------------------------
def _clamp01(v):
    return max(0.0, min(1.0, v))


def iou(a, b):
    ax0, ay0, ax1, ay1 = a
    bx0, by0, bx1, by1 = b
    ix0, iy0 = max(ax0, bx0), max(ay0, by0)
    ix1, iy1 = min(ax1, bx1), min(ay1, by1)
    iw, ih = max(0.0, ix1 - ix0), max(0.0, iy1 - iy0)
    inter = iw * ih
    if inter <= 0:
        return 0.0
    area_a = max(0.0, ax1 - ax0) * max(0.0, ay1 - ay0)
    area_b = max(0.0, bx1 - bx0) * max(0.0, by1 - by0)
    union = area_a + area_b - inter
    return inter / union if union > 0 else 0.0


def center_dist(a, b):
    acx, acy = (a[0] + a[2]) / 2, (a[1] + a[3]) / 2
    bcx, bcy = (b[0] + b[2]) / 2, (b[1] + b[3]) / 2
    return ((acx - bcx) ** 2 + (acy - bcy) ** 2) ** 0.5


def _match_ok(a, b):
    return iou(a, b) > 0.12 or center_dist(a, b) < 0.10


def _match_score(a, b):
    return iou(a, b) - center_dist(a, b) * 0.5


def pad_box(box, pad):
    x0, y0, x1, y1 = box
    bw, bh = x1 - x0, y1 - y0
    return (
        _clamp01(x0 - bw * pad),
        _clamp01(y0 - bh * pad),
        _clamp01(x1 + bw * pad),
        _clamp01(y1 + bh * pad),
    )


def _fbox(box):
    """Force a box to plain Python floats (vision.faces boxes are numpy
    float32, which json.dumps rejects)."""
    return (float(box[0]), float(box[1]), float(box[2]), float(box[3]))


# Minimum face box size, as a fraction of the image/frame's width and height.
# Tuned against the Pre-K PM test batch: a static wall poster/book-cover
# illustration of a cartoon child produced a cluster of speck-sized "faces"
# (~0.005-0.011 fraction, conf 0.6-0.76) that fragmented into a dozen
# one-sample video tracks and several stray photo ids. Real children's faces
# in this batch, even small background ones, never went below ~0.018. This
# threshold trades a few extra missed-detection-at-a-distance faces (see the
# module docstring's "known limits") for cutting that whole false-positive
# cluster before a human ever has to look at it.
MIN_BOX_FRAC = 0.015


def _valid_det(d, min_conf, min_box_frac=MIN_BOX_FRAC):
    if d["conf"] < min_conf:
        return False
    x0, y0, x1, y1 = d["box"]
    return (x1 - x0) >= min_box_frac and (y1 - y0) >= min_box_frac


# ---------------------------------------------------------------------------
# fonts
# ---------------------------------------------------------------------------
_font_cache = {}


def _font(size, bold=True):
    key = (size, bold)
    if key in _font_cache:
        return _font_cache[key]
    for candidate in (
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
    ):
        if Path(candidate).exists():
            f = ImageFont.truetype(candidate, size)
            _font_cache[key] = f
            return f
    f = ImageFont.load_default(size=size)
    _font_cache[key] = f
    return f


# ---------------------------------------------------------------------------
# photo face detection (two scales -- fraction boxes are scale-invariant,
# so results from different long_sides are directly comparable/dedupeable)
# ---------------------------------------------------------------------------
def _open_full(path):
    im = Image.open(str(path))
    im = ImageOps.exif_transpose(im).convert("RGB")
    return im


def _dedupe_dets(dets, iou_thresh=0.35):
    dets = sorted(dets, key=lambda d: -d["conf"])
    kept = []
    for d in dets:
        if any(iou(d["box"], k["box"]) > iou_thresh for k in kept):
            continue
        kept.append(d)
    return kept


def detect_photo_faces(im, min_conf=0.6, long_sides=(2400, 1600)):
    """Face DETECTION only, at two scales, deduped. Returns fraction boxes."""
    all_dets = []
    for ls in long_sides:
        scaled = im.copy()
        scaled.thumbnail((ls, ls), Image.LANCZOS)
        for d in vision.faces(scaled):
            cd = {"box": _fbox(d["box"]), "conf": float(d["conf"])}
            if _valid_det(cd, min_conf):
                all_dets.append(cd)
    return _dedupe_dets(all_dets)


# ---------------------------------------------------------------------------
# video sampling + per-video spatial tracking (NOT identification: this only
# follows a face's motion across CONSECUTIVE sampled frames of ONE video)
# ---------------------------------------------------------------------------
def _decode_video(path):
    import cv2

    cap = cv2.VideoCapture(str(path))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frames = []
    while True:
        ok, f = cap.read()
        if not ok:
            break
        frames.append(f)  # BGR, native resolution
    cap.release()
    return frames, fps


def _bgr_to_pil(frame):
    return Image.fromarray(frame[:, :, ::-1])


def sample_video_faces(path, video_fps=4, min_conf=0.6):
    """Decode `path`, sample at ~video_fps, detect faces per sampled frame.
    Returns (frames_bgr, sample_indices, times, per_frame_dets)."""
    frames, src_fps = _decode_video(path)
    if not frames:
        return frames, [], [], []
    step = max(1, round(src_fps / video_fps))
    idxs = list(range(0, len(frames), step))
    times = [i / src_fps for i in idxs]
    per_frame_dets = []
    for i in idxs:
        cand = [{"box": _fbox(d["box"]), "conf": float(d["conf"])} for d in vision.faces(_bgr_to_pil(frames[i]))]
        per_frame_dets.append([d for d in cand if _valid_det(d, min_conf)])
    return frames, idxs, times, per_frame_dets


def link_tracks(times, per_frame_dets, max_gap=3):
    """Link detections across consecutive sampled frames of ONE video into
    tracks by box IoU / center distance. Spatial tracking only -- see module
    docstring. A track that only matched on one sample still counts."""
    active = []  # dicts: samples=[(t,box)], confs=[...], missed=int
    finished = []
    for t, dets in zip(times, per_frame_dets):
        used = set()
        for tr in active:
            if tr["missed"] > max_gap:
                continue
            last_box = tr["samples"][-1][1]
            best_j, best_score = None, -1.0
            for j, d in enumerate(dets):
                if j in used or not _match_ok(last_box, d["box"]):
                    continue
                score = _match_score(last_box, d["box"])
                if score > best_score:
                    best_score, best_j = score, j
            if best_j is not None:
                tr["samples"].append((t, dets[best_j]["box"]))
                tr["confs"].append(dets[best_j]["conf"])
                tr["missed"] = 0
                used.add(best_j)
            else:
                tr["missed"] += 1
        for j, d in enumerate(dets):
            if j not in used:
                active.append({"samples": [(t, d["box"])], "confs": [d["conf"]], "missed": 0})
        still, retire = [], []
        for tr in active:
            (retire if tr["missed"] > max_gap else still).append(tr)
        finished.extend(retire)
        active = still
    finished.extend(active)
    return finished


# ---------------------------------------------------------------------------
# card rendering (face_sheet.jpg / .html)
# ---------------------------------------------------------------------------
def _face_crop(im, box, pad=0.4, target=220):
    w, h = im.size
    x0, y0, x1, y1 = pad_box(box, pad)
    px0, py0, px1, py1 = int(x0 * w), int(y0 * h), int(x1 * w), int(y1 * h)
    px1, py1 = max(px0 + 1, px1), max(py0 + 1, py1)
    crop = im.crop((px0, py0, px1, py1))
    scale = target / max(1, min(crop.width, crop.height))
    crop = crop.resize((max(1, round(crop.width * scale)), max(1, round(crop.height * scale))), Image.LANCZOS)
    return crop


def _context_thumb(im, box, width=300):
    w, h = im.size
    scale = width / w
    th = im.resize((width, max(1, round(h * scale))), Image.LANCZOS)
    d = ImageDraw.Draw(th)
    x0, y0, x1, y1 = box
    d.rectangle([x0 * width, y0 * th.height, x1 * width, y1 * th.height], outline=(255, 32, 32), width=4)
    return th


def _make_card(fid, crop_img, context_img, caption_lines):
    pad = 12
    width = max(crop_img.width, context_img.width) + pad * 2
    id_font = _font(46)
    cap_font = _font(17, bold=False)
    id_h = 56
    line_h = 21
    cap_h = line_h * len(caption_lines) + 6
    height = pad + id_h + crop_img.height + 8 + context_img.height + 8 + cap_h + pad
    card = Image.new("RGB", (width, height), (255, 255, 255))
    d = ImageDraw.Draw(card)
    d.rectangle([0, 0, width - 1, height - 1], outline=(60, 60, 60), width=2)
    d.text((pad, pad), fid, font=id_font, fill=(190, 0, 0))
    y = pad + id_h
    card.paste(crop_img, ((width - crop_img.width) // 2, y))
    y += crop_img.height + 8
    card.paste(context_img, ((width - context_img.width) // 2, y))
    y += context_img.height + 8
    for line in caption_lines:
        d.text((pad, y), line, font=cap_font, fill=(20, 20, 20))
        y += line_h
    return card


def _grid_sheet(cards, cols=5, bg=(235, 235, 235)):
    cw = max(c.width for c in cards)
    ch = max(c.height for c in cards)
    rows = -(-len(cards) // cols)
    sheet = Image.new("RGB", (cw * cols, ch * rows), bg)
    for i, c in enumerate(cards):
        x, y = (i % cols) * cw, (i // cols) * ch
        sheet.paste(c, (x + (cw - c.width) // 2, y + (ch - c.height) // 2))
    return sheet


def _img_b64(im, fmt="JPEG"):
    buf = io.BytesIO()
    im.convert("RGB").save(buf, format=fmt, quality=85)
    return base64.b64encode(buf.getvalue()).decode("ascii")


def _write_html(entries, out_path):
    """entries: list of (fid, crop_img, caption_html)."""
    rows = []
    for fid, crop_img, caption in entries:
        b64 = _img_b64(crop_img)
        rows.append(f'''
        <label class="card">
          <input type="checkbox" class="chk" value="{fid}" onchange="sync()">
          <div class="id">{fid}</div>
          <img src="data:image/jpeg;base64,{b64}">
          <div class="cap">{caption}</div>
        </label>''')
    html = f"""<!doctype html>
<html><head><meta charset="utf-8"><title>Face check sheet</title>
<style>
body {{ font-family: Arial, sans-serif; background:#eee; margin:0; padding:16px; }}
h1 {{ font-size: 20px; }}
p.help {{ color:#333; max-width:700px; }}
#out {{ width: 100%; max-width: 700px; font-size: 16px; padding: 8px; box-sizing: border-box; }}
.toolbar {{ margin: 10px 0 20px; }}
.grid {{ display:flex; flex-wrap:wrap; gap:12px; }}
.card {{ background:#fff; border:2px solid #999; border-radius:8px; padding:10px; width:200px;
         display:flex; flex-direction:column; align-items:center; cursor:pointer; }}
.card:has(.chk:checked) {{ border-color:#c00; background:#ffecec; }}
.id {{ font-weight:bold; font-size:20px; color:#a00; }}
img {{ max-width:180px; border-radius:6px; margin:6px 0; }}
.cap {{ font-size:12px; color:#333; text-align:center; word-break:break-word; }}
.chk {{ position:absolute; top:8px; right:8px; width:20px; height:20px; }}
</style></head>
<body>
<h1>Face check sheet</h1>
<p class="help">Tick every face that must be blurred (no photo release on file). When done,
copy the text box below and hand the ids back so the toolkit can render the blurred
photos/video. This only detects and numbers faces -- a person decides who is who.</p>
<div class="toolbar"><textarea id="out" rows="2" readonly placeholder="Selected ids will appear here"></textarea></div>
<div class="grid">
{"".join(rows)}
</div>
<script>
function sync() {{
  var ids = Array.from(document.querySelectorAll('.chk:checked')).map(c => c.value);
  document.getElementById('out').value = ids.join(', ');
}}
</script>
</body></html>"""
    Path(out_path).write_text(html, encoding="utf-8")


# ---------------------------------------------------------------------------
# build
# ---------------------------------------------------------------------------
def _expand_sources(sources):
    out = []
    for s in sources:
        p = Path(s)
        if p.is_dir():
            out.extend(q for q in sorted(p.iterdir()) if q.suffix.lower() in IMAGE_EXTS | VIDEO_EXTS)
        else:
            out.append(p)
    return sorted(set(out), key=lambda p: p.name.lower())


def build(sources, out_dir, video_fps=4, min_conf=0.6):
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    files = _expand_sources(sources)

    faces_json = {}
    cards = []  # (fid, crop_img, caption_lines) in source order for the grid
    html_entries = []
    n_pid, n_vid = 0, 0

    for path in files:
        ext = path.suffix.lower()
        if ext in IMAGE_EXTS:
            im = _open_full(path)
            dets = detect_photo_faces(im, min_conf=min_conf)
            for d in dets:
                n_pid += 1
                fid = f"P{n_pid}"
                faces_json[fid] = {
                    "kind": "photo",
                    "source": str(path.resolve()),
                    "box": list(d["box"]),
                    "conf": d["conf"],
                    "best_frame_time": None,
                }
                crop = _face_crop(im, d["box"])
                ctx = _context_thumb(im, d["box"])
                caption = [fid, path.name]
                cards.append(_make_card(fid, crop, ctx, [path.name]))
                html_entries.append((fid, crop, path.name))
        elif ext in VIDEO_EXTS:
            frames, idxs, times, per_frame_dets = sample_video_faces(path, video_fps=video_fps, min_conf=min_conf)
            if not frames:
                print(f"WARNING: could not decode {path}")
                continue
            tracks = link_tracks(times, per_frame_dets)
            for tr in tracks:
                n_vid += 1
                fid = f"V{n_vid}"
                best_i = max(range(len(tr["confs"])), key=lambda i: tr["confs"][i])
                best_t, best_box = tr["samples"][best_i]
                t0, t1 = tr["samples"][0][0], tr["samples"][-1][0]
                faces_json[fid] = {
                    "kind": "video",
                    "source": str(path.resolve()),
                    "timeline": [[t, list(b)] for t, b in tr["samples"]],
                    "best_frame_time": best_t,
                }
                # render context/crop from the best-confidence sampled frame
                best_frame_idx = idxs[times.index(best_t)]
                best_pil = _bgr_to_pil(frames[best_frame_idx])
                crop = _face_crop(best_pil, best_box)
                ctx = _context_thumb(best_pil, best_box)
                trange = f"{t0:.1f}-{t1:.1f}s ({len(tr['samples'])} samples)"
                cards.append(_make_card(fid, crop, ctx, [path.name, trange]))
                html_entries.append((fid, crop, f"{path.name}<br>{trange}"))
        else:
            print(f"skipping (not photo/video): {path}")

    faces_json_path = out_dir / "faces.json"
    faces_json_path.write_text(json.dumps(faces_json, indent=2), encoding="utf-8")

    sheet_path = out_dir / "face_sheet.jpg"
    html_path = out_dir / "face_sheet.html"
    if cards:
        _grid_sheet(cards, cols=min(5, len(cards))).save(sheet_path, quality=88)
    _write_html(html_entries, html_path)

    print(f"faces.json: {faces_json_path}")
    print(f"face_sheet.jpg: {sheet_path if cards else '(no faces detected, not written)'}")
    print(f"face_sheet.html: {html_path}")
    print(f"{n_pid} face(s) in photos, {n_vid} track(s) in video(s)")
    return {
        "faces_json": faces_json_path,
        "sheet": sheet_path if cards else None,
        "html": html_path,
        "n_photo_faces": n_pid,
        "n_video_tracks": n_vid,
    }


# ---------------------------------------------------------------------------
# blur_plan
# ---------------------------------------------------------------------------
def blur_plan(faces_json, ids):
    data = json.loads(Path(faces_json).read_text(encoding="utf-8")) if not isinstance(faces_json, dict) else faces_json
    photos, videos = {}, {}
    for fid in ids:
        info = data[fid]
        if info["kind"] == "photo":
            stem = Path(info["source"]).stem
            photos.setdefault(stem, []).append(list(pad_box(info["box"], 0.25)))
        else:
            videos.setdefault(info["source"], []).append(fid)
    return {"photos": photos, "videos": videos}


# ---------------------------------------------------------------------------
# blur_video_faces
# ---------------------------------------------------------------------------
def _interp_track(timeline, t, hold=0.5):
    times = [s[0] for s in timeline]
    boxes = [s[1] for s in timeline]
    if t < times[0]:
        return boxes[0] if times[0] - t <= hold else None
    if t > times[-1]:
        return boxes[-1] if t - times[-1] <= hold else None
    for i in range(len(times) - 1):
        if times[i] <= t <= times[i + 1]:
            t0, t1 = times[i], times[i + 1]
            b0, b1 = boxes[i], boxes[i + 1]
            if t1 == t0:
                return b0
            f = (t - t0) / (t1 - t0)
            return tuple(b0[k] + (b1[k] - b0[k]) * f for k in range(4))
    return boxes[-1]


def _apply_blur(frame_bgr, boxes, pad=0.35):
    import cv2

    if not boxes:
        return frame_bgr
    h, w = frame_bgr.shape[:2]
    mask = np.zeros((h, w), np.uint8)
    for box in boxes:
        x0, y0, x1, y1 = pad_box(box, pad)
        cx, cy = int((x0 + x1) / 2 * w), int((y0 + y1) / 2 * h)
        ax, ay = max(1, int((x1 - x0) / 2 * w)), max(1, int((y1 - y0) / 2 * h))
        cv2.ellipse(mask, (cx, cy), (ax, ay), 0, 0, 360, 255, -1)
    mask = cv2.GaussianBlur(mask, (0, 0), 9)
    a = mask.astype(np.float32)[..., None] / 255.0
    blurred = cv2.GaussianBlur(frame_bgr, (0, 0), 22)
    out = (frame_bgr.astype(np.float32) * (1 - a) + blurred.astype(np.float32) * a).astype(np.uint8)
    return out


def blur_video_faces(src, dst, faces_json, track_ids, check_path=None, min_conf=0.6, crf=12):
    """Re-detect every frame, follow each selected track, blur it generously.

    Detection each frame is fresh face DETECTION (YuNet); track_ids only tell
    this function WHICH already-numbered tracks (from `build()`) to follow --
    there is still no cross-frame identity matching, only nearest-detection
    association to the track's own interpolated position.
    """
    import cv2

    data = json.loads(Path(faces_json).read_text(encoding="utf-8"))
    tracks = {tid: data[tid]["timeline"] for tid in track_ids}

    frames, fps = _decode_video(src)
    if not frames:
        raise RuntimeError(f"could not decode {src}")
    h, w = frames[0].shape[:2]

    proc = subprocess.Popen(
        [ffmpeg(), "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{w}x{h}",
         "-r", str(fps), "-i", "-", "-c:v", "libx264", "-crf", str(crf), "-preset", "slow",
         "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(dst)],
        stdin=subprocess.PIPE,
    )

    stats = {tid: {"frames_active": 0, "detected": 0, "held": 0} for tid in track_ids}
    checks = []

    for i, frame in enumerate(frames):
        t = i / fps
        cand = [{"box": _fbox(d["box"]), "conf": float(d["conf"])} for d in vision.faces(_bgr_to_pil(frame))]
        dets = [d["box"] for d in cand if _valid_det(d, min_conf)]
        used = [False] * len(dets)
        final_boxes = []
        for tid, timeline in tracks.items():
            seed = _interp_track(timeline, t)
            if seed is None:
                continue
            best_j, best_score = None, -1.0
            for j, db in enumerate(dets):
                if used[j] or not _match_ok(seed, db):
                    continue
                score = _match_score(seed, db)
                if score > best_score:
                    best_score, best_j = score, j
            if best_j is not None:
                final_box = dets[best_j]
                used[best_j] = True
                stats[tid]["detected"] += 1
            else:
                final_box = seed
                stats[tid]["held"] += 1
            stats[tid]["frames_active"] += 1
            final_boxes.append(final_box)

        out_frame = _apply_blur(frame, final_boxes, pad=0.38)
        proc.stdin.write(out_frame.tobytes())

        if check_path and (i % 10 == 0 or i == len(frames) - 1):
            t_img = out_frame.copy()
            cv2.putText(t_img, f"{i} t={t:.2f}s", (10, 40), 0, 1.0, (255, 255, 255), 3)
            checks.append(t_img)

    proc.stdin.close()
    proc.wait()

    if check_path and checks:
        while len(checks) % 4:
            checks.append(np.zeros_like(checks[0]))
        rows = [np.hstack(checks[j:j + 4]) for j in range(0, len(checks), 4)]
        sheet = np.vstack(rows)
        Path(check_path).parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(str(check_path), cv2.resize(sheet, None, fx=0.5, fy=0.5))

    return stats


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def _cli_build(out_dir, sources):
    build(sources, out_dir)


def _cli_blur(faces_json_path, ids_csv, out_dir):
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    ids = [s.strip() for s in ids_csv.split(",") if s.strip()]
    data = json.loads(Path(faces_json_path).read_text(encoding="utf-8"))
    plan = blur_plan(data, ids)

    for stem, boxes in plan["photos"].items():
        src_path = next(Path(v["source"]) for v in data.values() if v["kind"] == "photo" and Path(v["source"]).stem == stem)
        from reelkit import load_photo
        im = load_photo(src_path, long_side=4000, blur=[tuple(b) for b in boxes])
        out_path = out_dir / f"{stem}-blurred.jpg"
        im.convert("RGB").save(out_path, quality=92)
        print("wrote", out_path)

    for source, tids in plan["videos"].items():
        src_path = Path(source)
        out_path = out_dir / f"{src_path.stem}-blurred.mp4"
        check_path = out_dir / f"{src_path.stem}-blurred-check.jpg"
        stats = blur_video_faces(src_path, out_path, faces_json_path, tids, check_path=check_path)
        print("wrote", out_path, "check:", check_path)
        for tid, s in stats.items():
            print(f"  {tid}: {s['detected']} detected / {s['held']} held / {s['frames_active']} active frames")


if __name__ == "__main__":
    if len(sys.argv) >= 4 and sys.argv[1] == "build":
        _cli_build(sys.argv[2], sys.argv[3:])
    elif len(sys.argv) == 5 and sys.argv[1] == "blur":
        _cli_blur(sys.argv[2], sys.argv[3], sys.argv[4])
    else:
        print("usage: python facesheet.py build <out_dir> <file-or-folder>...")
        print("       python facesheet.py blur <faces.json> <id,id,...> <out_dir>")
        sys.exit(1)
