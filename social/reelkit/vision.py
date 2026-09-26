"""vision.py -- face detection (not recognition) and smart-crop/cutout helpers.

Detects where faces are in a photo so a reel renderer can keep every face in
frame when cropping to a vertical (9:16) or square-ish (4:5) aspect, and can
produce a scrapbook-style "sticker" cutout of the photo's subject.

This module does face DETECTION only (bounding boxes). It never identifies,
names, matches, or recognizes a specific person -- there is no face-embedding
or face-recognition code here, intentionally.

API:
    faces(img) -> list[dict]
        img: PIL.Image.Image (RGB) or a path (str/Path).
        Returns [{"box": (x0, y0, x1, y1), "conf": float}, ...] with box
        coordinates as fractions of image width/height (0..1).

    smart_crop(img, aspect, zoom=1.0) -> (x0, y0, x1, y1)
        aspect: target width/height ratio, e.g. 9/16 for a reel, 4/5 for a
        feed post. Returns a fractional crop box that contains every
        detected face (centered on the union of face boxes), falling back
        to a center crop when no faces are found. zoom > 1.0 tightens the
        crop (zooms in) as long as faces still fit.

    cutout(img) -> PIL.Image.Image (RGBA)
        Background-removed version of img via rembg (u2net model, cached
        under %LOCALAPPDATA%/wcp-reelkit/models).

    sticker_outline(rgba, px=14) -> PIL.Image.Image (RGBA)
        Adds a white die-cut border + soft drop shadow around the subject
        in an RGBA cutout, for a scrapbook-sticker look.

CLI:
    python vision.py test <file> <out_dir>
        Writes <stem>-faces.jpg (boxes drawn), <stem>-crop-9x16.jpg,
        <stem>-crop-4x5.jpg, and <stem>-sticker.png.

Requires: opencv-python (`pip install opencv-python`) for face detection,
rembg (`pip install rembg`) for cutouts, pillow_heif for HEIC support.
The YuNet face model is downloaded on first use to
%LOCALAPPDATA%/wcp-reelkit/models/face_detection_yunet_2023mar.onnx
"""
from __future__ import annotations

import os
import sys
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

try:
    import pillow_heif

    pillow_heif.register_heif_opener()
except ImportError:
    pass

_MODEL_DIR = Path(os.environ.get("LOCALAPPDATA", Path.home())) / "wcp-reelkit" / "models"
_YUNET_PATH = _MODEL_DIR / "face_detection_yunet_2023mar.onnx"
_YUNET_URL = (
    "https://github.com/opencv/opencv_zoo/raw/main/models/"
    "face_detection_yunet/face_detection_yunet_2023mar.onnx"
)

_detector = None


def _to_pil(img):
    if isinstance(img, Image.Image):
        return img.convert("RGB")
    im = Image.open(Path(img))
    im = ImageOps.exif_transpose(im)
    return im.convert("RGB")


def _ensure_yunet():
    global _detector
    if _detector is not None:
        return _detector
    try:
        import cv2
    except ImportError as exc:
        raise ImportError(
            "opencv-python is required for face detection: pip install opencv-python"
        ) from exc

    if not _YUNET_PATH.exists():
        _MODEL_DIR.mkdir(parents=True, exist_ok=True)
        print(f"vision.py: downloading YuNet face model to {_YUNET_PATH} ...")
        urllib.request.urlretrieve(_YUNET_URL, _YUNET_PATH)

    # input_size is set per-call via detector.setInputSize(); (320,320) here
    # is just a placeholder, faces() resizes it to the actual image size.
    _detector = cv2.FaceDetectorYN.create(
        str(_YUNET_PATH), "", (320, 320), score_threshold=0.6
    )
    return _detector


def faces(img):
    """Detect faces, returning fractional boxes + confidence."""
    import cv2

    im = _to_pil(img)
    w, h = im.size
    detector = _ensure_yunet()
    detector.setInputSize((w, h))

    arr = np.array(im)[:, :, ::-1]  # RGB -> BGR for opencv
    _, det = detector.detect(arr)

    results = []
    if det is not None:
        for row in det:
            x, y, bw, bh = row[0:4]
            conf = float(row[14]) if len(row) > 14 else 1.0
            x0 = max(0.0, x / w)
            y0 = max(0.0, y / h)
            x1 = min(1.0, (x + bw) / w)
            y1 = min(1.0, (y + bh) / h)
            results.append({"box": (x0, y0, x1, y1), "conf": conf})
    return results


def smart_crop(img, aspect, zoom=1.0):
    """Return a fractional crop box (x0,y0,x1,y1) that keeps all faces in frame."""
    im = _to_pil(img)
    w, h = im.size
    face_list = faces(im)

    if face_list:
        fx0 = min(f["box"][0] for f in face_list)
        fy0 = min(f["box"][1] for f in face_list)
        fx1 = max(f["box"][2] for f in face_list)
        fy1 = max(f["box"][3] for f in face_list)
        cx = (fx0 + fx1) / 2
        cy = (fy0 + fy1) / 2
        face_w = fx1 - fx0
        face_h = fy1 - fy0
    else:
        cx, cy = 0.5, 0.5
        face_w = face_h = 0.0

    img_aspect = w / h
    if aspect <= img_aspect:
        # crop width, keep full height, then scale by zoom
        crop_h = 1.0
        crop_w = aspect / img_aspect
    else:
        crop_w = 1.0
        crop_h = img_aspect / aspect

    # Don't zoom in past the point where faces would be clipped.
    min_crop_w = min(1.0, face_w * 1.3) if face_w else 0.0
    min_crop_h = min(1.0, face_h * 1.3) if face_h else 0.0
    crop_w = max(crop_w / zoom, min_crop_w)
    crop_h = max(crop_h / zoom, min_crop_h)
    # Re-lock the aspect ratio after clamping. crop_w/crop_h are FRACTIONS of
    # the image, so the target fraction ratio is aspect / img_aspect, not
    # aspect itself (those only agree on a square image).
    r = aspect / img_aspect
    if crop_w / crop_h < r:
        crop_w = crop_h * r
    else:
        crop_h = crop_w / r
    # Shrink both sides together if either overflows, so the ratio holds.
    over = max(crop_w, crop_h)
    if over > 1.0:
        crop_w /= over
        crop_h /= over

    x0 = cx - crop_w / 2
    x1 = cx + crop_w / 2
    y0 = cy - crop_h / 2
    y1 = cy + crop_h / 2

    # Shift back into [0,1] without changing crop size.
    if x0 < 0:
        x1 -= x0
        x0 = 0.0
    if x1 > 1:
        x0 -= x1 - 1
        x1 = 1.0
    if y0 < 0:
        y1 -= y0
        y0 = 0.0
    if y1 > 1:
        y0 -= y1 - 1
        y1 = 1.0
    x0, y0 = max(0.0, x0), max(0.0, y0)
    x1, y1 = min(1.0, x1), min(1.0, y1)
    return (x0, y0, x1, y1)


def cutout(img):
    """Background-removed RGBA cutout via rembg."""
    try:
        from rembg import remove
    except ImportError as exc:
        raise ImportError("rembg is required for cutouts: pip install rembg") from exc

    im = _to_pil(img)
    out = remove(im)
    return out.convert("RGBA")


def sticker_outline(rgba, px=14):
    """Add a white die-cut border + soft shadow to an RGBA cutout."""
    alpha = rgba.split()[-1]
    # Grow the alpha mask by `px` to build the white border, then blur a
    # second, larger copy for the drop shadow.
    border_mask = alpha.filter(ImageFilter.MaxFilter(px * 2 + 1))
    shadow_mask = alpha.filter(ImageFilter.GaussianBlur(px * 1.2))

    canvas = Image.new("RGBA", rgba.size, (0, 0, 0, 0))

    shadow_layer = Image.new("RGBA", rgba.size, (0, 0, 0, 160))
    shadow_layer.putalpha(shadow_mask.point(lambda a: int(a * 0.6)))
    shadow_offset = Image.new("RGBA", rgba.size, (0, 0, 0, 0))
    shadow_offset.paste(shadow_layer, (int(px * 0.4), int(px * 0.6)), shadow_layer)
    canvas = Image.alpha_composite(canvas, shadow_offset)

    white_layer = Image.new("RGBA", rgba.size, (255, 255, 255, 255))
    white_layer.putalpha(border_mask)
    canvas = Image.alpha_composite(canvas, white_layer)

    canvas = Image.alpha_composite(canvas, rgba)
    return canvas


def _draw_faces(img, face_list):
    im = _to_pil(img).copy()
    w, h = im.size
    draw = ImageDraw.Draw(im)
    for f in face_list:
        x0, y0, x1, y1 = f["box"]
        draw.rectangle([x0 * w, y0 * h, x1 * w, y1 * h], outline=(255, 0, 0), width=4)
        draw.text((x0 * w, max(0, y0 * h - 20)), f"{f['conf']:.2f}", fill=(255, 0, 0))
    return im


def _crop_to_jpg(img, box):
    im = _to_pil(img)
    w, h = im.size
    x0, y0, x1, y1 = box
    return im.crop((int(x0 * w), int(y0 * h), int(x1 * w), int(y1 * h)))


def _cli_test(path_str, out_dir_str):
    path = Path(path_str)
    out_dir = Path(out_dir_str)
    out_dir.mkdir(parents=True, exist_ok=True)
    stem = path.stem

    im = _to_pil(path)
    face_list = faces(im)
    print(f"{path.name}: {len(face_list)} face(s) detected")
    for f in face_list:
        print(f"  box={f['box']} conf={f['conf']:.3f}")

    annotated = _draw_faces(im, face_list)
    annotated.save(out_dir / f"{stem}-faces.jpg", quality=90)

    crop916 = smart_crop(im, 9 / 16)
    _crop_to_jpg(im, crop916).save(out_dir / f"{stem}-crop-9x16.jpg", quality=90)
    print(f"  9:16 crop box: {crop916}")

    crop45 = smart_crop(im, 4 / 5)
    _crop_to_jpg(im, crop45).save(out_dir / f"{stem}-crop-4x5.jpg", quality=90)
    print(f"  4:5 crop box: {crop45}")

    try:
        rgba = cutout(im)
        sticker = sticker_outline(rgba)
        sticker.save(out_dir / f"{stem}-sticker.png")
        print(f"  wrote sticker PNG")
    except Exception as exc:  # noqa: BLE001
        print(f"  cutout FAILED: {exc}")

    print(f"Wrote outputs to {out_dir}")


if __name__ == "__main__":
    if len(sys.argv) != 4 or sys.argv[1] != "test":
        print("usage: python vision.py test <file> <out_dir>")
        sys.exit(1)
    _cli_test(sys.argv[2], sys.argv[3])
