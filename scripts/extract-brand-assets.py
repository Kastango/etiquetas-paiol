"""Rebuild the Paiol logo files and the brand kit from the original vector business card.

uv run --with pymupdf --with pillow scripts/extract-brand-assets.py --pdf /path/to/paiol-cartaoVisitas-CEmail.pdf

Product photos come from scripts/extract-product-photos.py.
"""
import argparse
import copy
import io
import json
import subprocess
import re
import zipfile
from pathlib import Path
import xml.etree.ElementTree as ET
import pymupdf
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument("--pdf", type=Path, required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
out = root / "public/brand"
out.mkdir(parents=True, exist_ok=True)
ns = "http://www.w3.org/2000/svg"
ET.register_namespace("", ns)
page = pymupdf.open(args.pdf)[2]
source = ET.fromstring(page.get_svg_image(text_as_path=True))
glyphs = {e.get("id"): e for e in source.iter(f"{{{ns}}}path") if e.get("id")}
# The first seven coloured drawing paths are the original barn, not the background.
symbol = [copy.deepcopy(e) for e in source.iter(f"{{{ns}}}path")
          if not e.get("id") and e.get("fill") in ("#f0cda2", "#bfa574", "#8d313b")][:7]
wordmark = []
for e in source.iter(f"{{{ns}}}use"):
    href = e.get("{http://www.w3.org/1999/xlink}href", "")
    if href.startswith("#font_4_"):
        path = copy.deepcopy(glyphs[href[1:]])
        path.attrib.pop("id", None)
        path.set("transform", e.get("transform"))
        wordmark.append(path)
tagline = []
for e in source.iter(f"{{{ns}}}use"):
    href = e.get("{http://www.w3.org/1999/xlink}href", "")
    if href.startswith("#font_2_") and e.get("fill") == "#f0cda2":
        path = copy.deepcopy(glyphs[href[1:]])
        path.attrib.pop("id", None)
        path.set("transform", e.get("transform"))
        tagline.append(path)
assert len(symbol) == 7 and len(wordmark) == 5 and tagline, "Card layout differs from the supplied original"

def group(elements, transform, color=None):
    g = ET.Element(f"{{{ns}}}g", {"transform": transform} if transform else {})
    for original in elements:
        e = copy.deepcopy(original)
        if color:
            e.set("fill", color)
        g.append(e)
    return g

def svg_bytes(width, height, groups, box=(0, 0)):
    svg = ET.Element(f"{{{ns}}}svg", {"viewBox": f"{box[0]:.2f} {box[1]:.2f} {width:.2f} {height:.2f}",
        "width": f"{width * 4:.0f}", "height": f"{height * 4:.0f}", "role": "img"})
    ET.SubElement(svg, f"{{{ns}}}title").text = "Paiol Produtos Naturais"
    for g in groups:
        svg.append(copy.deepcopy(g))
    return ET.tostring(svg, encoding="utf-8", xml_declaration=True)

def rasterize(data, width):
    png = subprocess.run(["rsvg-convert", "-w", str(width)], input=data, capture_output=True, check=True).stdout
    return Image.open(io.BytesIO(png))

def write(name, groups, pad=0.08):
    """Fit the viewBox to the painted area of groups, drawn in card coordinates, plus padding."""
    left, top, right, bottom = bounds(groups)
    margin = pad * (bottom - top)
    box = (left - margin, top - margin)
    width, height = right - left + 2 * margin, bottom - top + 2 * margin
    data = svg_bytes(width, height, groups, box)
    (out / f"{name}.svg").write_bytes(data)
    rasterize(data, 1600).save(out / f"{name}.png", optimize=True)

def mono_symbol(color, light, mid):
    """The barn in solid tints of one ink: roof, door and window full; front and tower light; side wall mid."""
    facade, side, door, window, tower, roof, cone = symbol
    g = ET.Element(f"{{{ns}}}g")
    for e, fill in [(facade, light), (tower, light), (side, mid), (roof, color), (cone, color), (door, color), (window, color)]:
        e = copy.deepcopy(e)
        e.set("fill", fill)
        g.append(e)
    return g

def reversed_symbol(color, key):
    """The barn in solid white for dark backgrounds and photos, where tints would let the image through:
    thin gaps outline the roof and the tower cone; door and window are cut out."""
    facade, side, door, window, tower, roof, cone = symbol
    mask = ET.Element(f"{{{ns}}}mask", {"id": f"barn-{key}", "maskUnits": "userSpaceOnUse",
        "x": "0", "y": "0", "width": "321.118", "height": "207.732"})
    def paint(e, fill, stroke=False):
        e = copy.deepcopy(e)
        e.set("fill", fill)
        if stroke:
            e.set("stroke", fill); e.set("stroke-width", "0.7"); e.set("stroke-linejoin", "round")
        mask.append(e)
    for e in symbol:
        paint(e, "#fff")
    # A black stroke then the shape again leaves a gap only outside the roof and the cone.
    for e in (roof, cone):
        paint(e, "#000", stroke=True)
        paint(e, "#fff")
    paint(door, "#000"); paint(window, "#000")
    g = ET.Element(f"{{{ns}}}g")
    g.append(mask)
    ET.SubElement(g, f"{{{ns}}}rect", {"x": "140", "y": "45", "width": "40", "height": "40",
        "fill": color, "mask": f"url(#barn-{key})"})
    return g

def bounds(groups):
    probe = rasterize(svg_bytes(321.118, 207.732, groups), 3211)
    return [v / 10 for v in probe.getchannel("A").getbbox()]

# The card already sets barn, name and tagline in place; stacked lockups keep those positions.
# The horizontal lockup sets the name beside the barn, cap height at 60% of the barn, sharing its base.
sx0, sy0, sx1, sy1 = bounds([group(symbol, "")])
wx0, wy0, wx1, wy1 = bounds([group(wordmark, "")])
k = 0.6 * (sy1 - sy0) / (wy1 - wy0)
beside = f"translate({sx1 + 0.3 * (sy1 - sy0):.3f} {sy1:.3f}) scale({k:.4f}) translate({-wx0:.3f} {-wy1:.3f})"
for variant, color, tag in [("color", "#347265", "#347265"), ("reversed", "#ffffff", "#f0cda2")]:
    write(f"paiol-stacked-{variant}", [group(symbol, ""), group(wordmark, "", color), group(tagline, "", tag)])
    write(f"paiol-horizontal-{variant}", [group(symbol, ""), group(wordmark, beside, color)])
# For signs: name and tagline set to the same width beside the barn, the pair 90% of its height, sharing its base.
tx0, ty0, tx1, ty1 = bounds([group(tagline, "")])
wordmark_ratio, tagline_ratio = (wy1 - wy0) / (wx1 - wx0), (ty1 - ty0) / (tx1 - tx0)
text_width = 0.9 * (sy1 - sy0) / (wordmark_ratio * 1.12 + tagline_ratio)
left = sx1 + 0.3 * (sy1 - sy0)
kw, kt = text_width / (wx1 - wx0), text_width / (tx1 - tx0)
name_top = sy1 - 0.9 * (sy1 - sy0)
name_at = f"translate({left:.3f} {name_top:.3f}) scale({kw:.4f}) translate({-wx0:.3f} {-wy0:.3f})"
tag_at = f"translate({left:.3f} {sy1:.3f}) scale({kt:.4f}) translate({-tx0:.3f} {-ty1:.3f})"
for variant, color, tag in [("color", "#347265", "#347265"), ("reversed", "#ffffff", "#f0cda2")]:
    write(f"paiol-horizontal-tagline-{variant}", [group(symbol, ""), group(wordmark, name_at, color), group(tagline, tag_at, tag)])
write("paiol-symbol", [group(symbol, "")])
# Tints at 35% and 60% of the ink over white.
for name, color, light, mid in [("green", "#347265", "#b8cec9", "#85aaa3"), ("black", "#000000", "#a6a6a6", "#666666")]:
    write(f"paiol-symbol-{name}", [mono_symbol(color, light, mid)])
    write(f"paiol-horizontal-{name}", [mono_symbol(color, light, mid), group(wordmark, beside, color)])
write("paiol-symbol-white", [reversed_symbol("#ffffff", "symbol")])
write("paiol-horizontal-white", [reversed_symbol("#ffffff", "horizontal"), group(wordmark, beside, "#ffffff")])

icon = Image.open(out / "paiol-symbol.png")
icon.thumbnail((128, 128))
icon.save(root / "src/app/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
manifest = {"name": "Paiol Produtos Naturais", "source": "Logo extraída do cartão de visitas original, com letras em curvas.",
    "colors": {"verde": "#347265", "vinho": "#8D313B", "palha": "#F0CDA2", "dourado": "#BFA574", "verdeEscuro": "#243C34", "branco": "#FFFFFF"},
    "typefaces": {"display": "Fraunces Black 900", "text": "Poppins 400–800"},
    "clearSpace": "A altura do símbolo em todos os lados.",
    "minimumSizes": {"horizontal": "140 px / 35 mm", "symbol": "24 px / 8 mm"},
    "offerFormats": {"feed": "1080 × 1080", "retrato": "1080 × 1350", "story": "1080 × 1920"}}
(out / "paiol-brand.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
with zipfile.ZipFile(out / "paiol-brand-kit.zip", "w", zipfile.ZIP_DEFLATED) as archive:
    for path in sorted(out.iterdir()):
        if path.suffix in (".svg", ".png", ".json", ".md", ".txt"):
            archive.write(path, path.name)
    for file in ["Poppins-400.ttf", "Poppins-500.ttf", "Poppins-600.ttf", "Poppins-700.ttf", "Poppins-800.ttf", "Fraunces-Variable.ttf"]:
        archive.write(root / "public/fonts" / file, f"fonts/{file}")
    archive.write(out / "paiol-voz/SKILL.md", "paiol-voz/SKILL.md")
# The writing skill as Claude takes it: a zip holding the skill's folder.
with zipfile.ZipFile(out / "paiol-voz.zip", "w", zipfile.ZIP_DEFLATED) as archive:
    archive.write(out / "paiol-voz/SKILL.md", "paiol-voz/SKILL.md")
print(f"Generated {len(list(out.glob('*.svg')))} SVGs, PNGs and the kit archive")
