"""privacy.py -- OCR-based privacy scanning for WCP reel source photos.

Finds printed/handwritten text in a photo (name tags, cubby labels, storage
bins, artwork) and flags anything that looks like a child's first name so it
can be reviewed or blurred before a photo goes into a public reel.

This module does OCR text detection only. It does not identify who a person
is from their face; it only reads text already visible in the frame.

API:
    find_text(img) -> list[dict]
        img: PIL.Image.Image (RGB) or a path (str/Path) to an image file.
        Returns [{"box": (x0, y0, x1, y1), "text": str, "conf": float}, ...]
        Box coordinates are fractions of image width/height (0..1).

    flag_names(img, extra_stopwords=None) -> list[dict]
        Same return shape as find_text(), filtered down to entries that look
        like a personal first name: a single capitalized word, 3-12 letters,
        not in the classroom-vocabulary stoplist. Errs toward over-flagging
        (a missed real name is worse than a false positive on a word).

    blur_boxes(img, boxes, pad=0.01) -> PIL.Image.Image
        Returns a copy of img with each box (fractions, same shape as above)
        heavily gaussian-blurred, padded by `pad` (fraction of the relevant
        dimension) on each side.

CLI:
    python privacy.py scan <folder-or-file> <out_dir>
        Runs find_text + flag_names on every image in the folder (or the
        single file), writes:
          - <out_dir>/<stem>-annotated.jpg  (red boxes drawn over flags)
          - <out_dir>/flags.json            (all results, keyed by filename)
        and prints a one-line summary per file plus a grand total.

Requires: rapidocr-onnxruntime (`pip install rapidocr-onnxruntime`) as the
default OCR engine, or easyocr as a fallback (`pip install easyocr`).
Requires pillow_heif for HEIC support (`pip install pillow-heif`).
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageOps

try:
    import pillow_heif

    pillow_heif.register_heif_opener()
except ImportError:
    pass

_OCR_ENGINE = None
_OCR_BACKEND = None


def _get_ocr():
    """Lazily construct the OCR engine, preferring rapidocr over easyocr."""
    global _OCR_ENGINE, _OCR_BACKEND
    if _OCR_ENGINE is not None:
        return _OCR_ENGINE, _OCR_BACKEND
    try:
        from rapidocr_onnxruntime import RapidOCR

        _OCR_ENGINE = RapidOCR()
        _OCR_BACKEND = "rapidocr"
        return _OCR_ENGINE, _OCR_BACKEND
    except ImportError:
        pass
    try:
        import easyocr

        _OCR_ENGINE = easyocr.Reader(["en"])
        _OCR_BACKEND = "easyocr"
        return _OCR_ENGINE, _OCR_BACKEND
    except ImportError:
        pass
    raise ImportError(
        "No OCR engine available. Install one with:\n"
        "    pip install rapidocr-onnxruntime\n"
        "or:\n"
        "    pip install easyocr"
    )


# ---------- classroom-vocabulary stoplist ----------
# Words that show up constantly on classroom decor/labels but are never a
# child's name. Kept lowercase; matching is case-insensitive.
_STOPWORDS = set(
    w.lower()
    for w in [
        # days
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday",
        "Saturday", "Today", "Yesterday", "Tomorrow",
        # months
        "January", "February", "March", "April", "May", "June", "July",
        "August", "September", "October", "November", "December",
        # seasons / weather
        "Spring", "Summer", "Autumn", "Winter", "Weather", "Sunny",
        "Cloudy", "Rainy", "Snowy", "Windy", "Stormy", "Foggy", "Hot",
        "Cold", "Warm",
        # colors
        "Red", "Orange", "Yellow", "Green", "Blue", "Purple", "Pink",
        "Brown", "Black", "White", "Gray", "Grey", "Gold", "Silver",
        # numbers / counting
        "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight",
        "Nine", "Ten", "Eleven", "Twelve", "Number", "Numbers", "Count",
        "Counting",
        # alphabet / school words
        "Alphabet", "Letters", "Letter", "Words", "Word", "Sight", "Read",
        "Reading", "Writing", "Spelling", "Phonics", "Vowel", "Vowels",
        "Consonant",
        # generic classroom vocabulary
        "Welcome", "Friends", "Friend", "Family", "Home", "Classroom",
        "Class", "School", "Preschool", "Teacher", "Teachers", "Student",
        "Students", "Helper", "Helpers", "Calendar", "Schedule", "Circle",
        "Time", "Line", "Table", "Tables", "Chair", "Chairs", "Bin",
        "Bins", "Cubby", "Cubbies", "Locker", "Lockers", "Shelf",
        "Shelves", "Bathroom", "Playground", "Outside", "Inside", "Snack",
        "Lunch", "Nap", "Naptime", "Book", "Books", "Library", "Art",
        "Music", "Science", "Math", "Shapes", "Shape", "Circle", "Square",
        "Triangle", "Rectangle", "Oval", "Star", "Heart", "Diamond",
        "Please", "Thank", "Thanks", "Sorry", "Good", "Great", "Super",
        "Job", "Wonderful", "Amazing", "Happy", "Sad", "Mad", "Excited",
        "Calm", "Feelings", "Feeling", "Emotions", "Emotion", "Rules",
        "Rule", "Kind", "Kindness", "Share", "Sharing", "Clean", "Wash",
        "Hands", "Hand", "Wait", "Turn", "Turns", "Quiet", "Listen",
        "Listening", "Look", "Looking", "Stop", "Go", "Ready", "Set",
        "Birthday", "Birthdays", "Holiday", "Holidays", "Christmas",
        "Halloween", "Thanksgiving", "Easter", "Valentine", "Valentines",
        "New", "Year", "Zone", "Area", "Station", "Center", "Centers",
        "Group", "Groups", "Room", "Rooms", "Door", "Window", "Windows",
        "Floor", "Wall", "Walls", "Ceiling", "Toy", "Toys", "Block",
        "Blocks", "Puzzle", "Puzzles", "Game", "Games", "Ball", "Balls",
        "Play", "Playtime", "Outdoor", "Indoor", "Water", "Sand", "Paint",
        "Painting", "Crayon", "Crayons", "Marker", "Markers", "Glue",
        "Scissors", "Paper", "Pencil", "Pencils", "Draw", "Drawing",
        "Wcp", "West", "Chester", "Preschool", "Pre-k", "Prek", "Pre",
    ]
)

_NAME_RE = re.compile(r"^[A-Z][a-zA-Z'\-]{2,11}$")


def _to_pil(img):
    if isinstance(img, Image.Image):
        return img.convert("RGB")
    p = Path(img)
    im = Image.open(p)
    im = ImageOps.exif_transpose(im)
    return im.convert("RGB")


def find_text(img):
    """Run OCR over `img`, returning fractional boxes + text + confidence."""
    im = _to_pil(img)
    w, h = im.size
    engine, backend = _get_ocr()

    import numpy as np

    arr = np.array(im)

    results = []
    if backend == "rapidocr":
        ocr_result, _ = engine(arr)
        if ocr_result:
            for box, text, conf in ocr_result:
                xs = [p[0] for p in box]
                ys = [p[1] for p in box]
                x0, x1 = min(xs) / w, max(xs) / w
                y0, y1 = min(ys) / h, max(ys) / h
                results.append(
                    {
                        "box": (x0, y0, x1, y1),
                        "text": text,
                        "conf": float(conf),
                    }
                )
    elif backend == "easyocr":
        for box, text, conf in engine.readtext(arr):
            xs = [p[0] for p in box]
            ys = [p[1] for p in box]
            x0, x1 = min(xs) / w, max(xs) / w
            y0, y1 = min(ys) / h, max(ys) / h
            results.append(
                {"box": (x0, y0, x1, y1), "text": text, "conf": float(conf)}
            )
    return results


_LABEL_HINT_RE = re.compile(r"\bbin\b|\bcubby\b|\blocker\b|\blabel\b", re.I)


def flag_names(img, extra_stopwords=None):
    """Filter find_text() results down to probable personal first names."""
    stop = set(_STOPWORDS)
    if extra_stopwords:
        stop |= {w.lower() for w in extra_stopwords}

    flags = []
    for entry in find_text(img):
        text = entry["text"].strip()
        # Split multi-word OCR lines; a name label is often just one word,
        # but bins sometimes read as "Name Sam" etc. Check each token.
        tokens = re.split(r"\s+", text)
        for tok in tokens:
            tok_clean = tok.strip(".,:;!?\"'()[]")
            if not tok_clean:
                continue
            if tok_clean.lower() in stop:
                continue
            if _NAME_RE.match(tok_clean):
                flags.append(
                    {
                        "box": entry["box"],
                        "text": tok_clean,
                        "conf": entry["conf"],
                    }
                )
                break  # one flag per OCR entry is enough
    return flags


def blur_boxes(img, boxes, pad=0.01):
    """Return a copy of img with each fractional box heavily blurred."""
    im = _to_pil(img).copy()
    w, h = im.size
    blurred_full = im.filter(ImageFilter.GaussianBlur(radius=max(w, h) / 40))

    for b in boxes:
        box = b["box"] if isinstance(b, dict) else b
        x0, y0, x1, y1 = box
        px0 = max(0, int((x0 - pad) * w))
        py0 = max(0, int((y0 - pad) * h))
        px1 = min(w, int((x1 + pad) * w))
        py1 = min(h, int((y1 + pad) * h))
        if px1 <= px0 or py1 <= py0:
            continue
        region = blurred_full.crop((px0, py0, px1, py1))
        im.paste(region, (px0, py0))
    return im


def _draw_flags(img, flags):
    im = _to_pil(img).copy()
    w, h = im.size
    draw = ImageDraw.Draw(im)
    for f in flags:
        x0, y0, x1, y1 = f["box"]
        draw.rectangle(
            [x0 * w, y0 * h, x1 * w, y1 * h], outline=(255, 0, 0), width=4
        )
        draw.text((x0 * w, max(0, y0 * h - 22)), f["text"], fill=(255, 0, 0))
    return im


def _iter_images(target: Path):
    exts = {".jpg", ".jpeg", ".png", ".heic", ".heif"}
    if target.is_file():
        yield target
    else:
        for p in sorted(target.iterdir()):
            if p.suffix.lower() in exts:
                yield p


def _cli_scan(target_str, out_dir_str):
    target = Path(target_str)
    out_dir = Path(out_dir_str)
    out_dir.mkdir(parents=True, exist_ok=True)

    all_flags = {}
    total_flags = 0
    for path in _iter_images(target):
        print(f"scanning {path.name} ...", flush=True)
        try:
            im = _to_pil(path)
            text_hits = find_text(im)
            flags = flag_names(im)
        except Exception as exc:  # noqa: BLE001
            print(f"  ERROR on {path.name}: {exc}")
            all_flags[path.name] = {"error": str(exc)}
            continue

        annotated = _draw_flags(im, flags)
        out_path = out_dir / f"{path.stem}-annotated.jpg"
        annotated.convert("RGB").save(out_path, quality=90)

        all_flags[path.name] = {
            "text_hits": len(text_hits),
            "flags": flags,
        }
        total_flags += len(flags)
        names = ", ".join(f["text"] for f in flags) or "(none)"
        print(f"  {len(text_hits)} text hits, {len(flags)} name flags: {names}")

    (out_dir / "flags.json").write_text(
        json.dumps(all_flags, indent=2), encoding="utf-8"
    )
    print(f"\nTotal name flags across all images: {total_flags}")
    print(f"Wrote {out_dir / 'flags.json'} and annotated JPGs to {out_dir}")


if __name__ == "__main__":
    if len(sys.argv) != 4 or sys.argv[1] != "scan":
        print("usage: python privacy.py scan <folder-or-file> <out_dir>")
        sys.exit(1)
    _cli_scan(sys.argv[2], sys.argv[3])
