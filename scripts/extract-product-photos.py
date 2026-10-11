"""Product photos for the offer generator, cut out of the original offer PSDs.

uv run --with psd-tools --with pillow scripts/extract-product-photos.py --psd-dir /path/to/paiol

Each 1080 × 1080 post has one visible, masked photo above the green band: that layer, without its
drop shadows (the site draws its own), becomes public/products/<slug>.png. The same photo reused in
several PSDs is kept once. public/products/index.json lists the photos for the site.
"""
import argparse
import json
import re
import unicodedata
from pathlib import Path
from PIL import Image
from psd_tools import PSDImage

parser = argparse.ArgumentParser()
parser.add_argument("--psd-dir", type=Path, required=True)
args = parser.parse_args()
out = Path(__file__).resolve().parents[1] / "public/products"
out.mkdir(parents=True, exist_ok=True)

# File names that do not say what is in the photo.
NAMES = {
    "castanhas quebradas": "Nozes chilenas quebradas",
    "castanha do brasil": "Castanha-do-pará",
    "castanha do para": "Castanha-do-pará",
    "avela-s-casca": "Avelã sem casca",
    "coco flocos medio": "Coco em flocos médio",
    "arroz integral agulinha": "Arroz integral agulhinha",
    "amendoas sem casca": "Amêndoas sem casca",
    "nozes chilenas quebradas padrao": "Nozes chilenas quebradas (prato)",
}


def plain(text):
    return unicodedata.normalize("NFD", text).encode("ascii", "ignore").decode().lower()


def slug(text):
    return re.sub(r"[^a-z0-9]+", "-", plain(text)).strip("-")


def fingerprint(image):
    return image.convert("RGBA").resize((24, 24)).tobytes()


THRESHOLD = 6


def same_photo(a, b):
    """Crops of one photo differ by a few pixels; different products differ a lot more."""
    return sum(abs(x - y) for x, y in zip(a, b)) / len(a) < THRESHOLD


photos, seen = [], {}
for psd_path in sorted(args.psd_dir.glob("*.psd")):
    psd = PSDImage.open(psd_path)
    if psd.size != (1080, 1080):
        continue  # stories and other pieces have no product photo
    candidates = [layer for layer in psd.descendants()
                  if layer.visible and layer.has_mask() and layer.kind in ("smartobject", "pixel")
                  and layer.bbox[1] < 700 and layer.bbox[3] - layer.bbox[1] > 300]
    if not candidates:
        continue
    layer = max(candidates, key=lambda l: (l.bbox[2] - l.bbox[0]) * (l.bbox[3] - l.bbox[1]))
    image = layer.composite(apply_icc=True)
    alpha = image.getchannel("A")
    # Ignore nearly invisible pixels left by soft masks when trimming.
    bounds = alpha.point(lambda a: 255 if a > 24 else 0).getbbox()
    corners = [alpha.getpixel((x, y)) for x in (0, alpha.width - 1) for y in (0, alpha.height - 1)]
    if not bounds or min(corners) > 200:
        print(f"{psd_path.name}: photo has no cut-out background, skipped")
        continue
    image = image.crop(bounds)
    image.thumbnail((1200, 1200))
    key = fingerprint(image)
    stem = re.sub(r"^ddm-", "", psd_path.stem)
    name = NAMES.get(stem.lower(), stem[:1].upper() + stem[1:])
    duplicate = next((name for other, name in seen.items() if same_photo(key, other)), None)
    if duplicate:
        print(f"{psd_path.name}: same photo as {duplicate}")
        continue
    file, n = f"{slug(name)}.png", 1
    while any(p["src"] == f"/products/{file}" for p in photos):
        n += 1
        file = f"{slug(name)}-{n}.png"
    image.save(out / file, optimize=True)
    seen[key] = name
    words = set(re.findall(r"[a-z0-9]+", plain(name))) - {"de", "do", "da", "sem", "com"}
    photos.append({"name": name, "src": f"/products/{file}", "keywords": sorted(words)})
    print(f"{psd_path.name} -> {file} ({image.width}×{image.height})")

(out / "index.json").write_text(json.dumps(photos, ensure_ascii=False, indent=2) + "\n")
print(f"{len(photos)} photos")
