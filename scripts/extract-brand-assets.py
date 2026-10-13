"""Rebuild the Paiol logo files and the brand kit from the original vector business card.

uv run --with pymupdf --with pillow --with numpy --with fonttools --with skia-pathops scripts/extract-brand-assets.py --pdf /path/to/paiol-cartaoVisitas-CEmail.pdf

The seals set their ring of text in scripts/sources/Nunito-Variable.ttf (OFL), the face of "Produtos naturais" on the card.
Product photos come from scripts/extract-product-photos.py.
"""
import argparse
import copy
import io
import json
import math
import subprocess
import re
import zipfile
from pathlib import Path
import xml.etree.ElementTree as ET
import numpy as np
import pymupdf
import pathops
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.svgLib.path import parse_path
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
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

def outline(e, dy=0.0):
    """A card path as a pathops Path in card coordinates, moved down by dy."""
    a, b, c, d, tx, ty = (map(float, re.findall(r"-?[\d.]+(?:e-?\d+)?", e.get("transform"))) if e.get("transform")
                          else (1, 0, 0, 1, 0, 0))
    path = pathops.Path()
    parse_path(e.get("d"), TransformPen(path.getPen(), (a, b, c, d, tx, ty + dy)))
    return path

def reversed_symbol(color):
    """The barn in solid white for dark backgrounds and photos, where tints would let the image through:
    thin gaps outline the roof and the tower cone; door and window are cut out. One plain path, worked out
    with boolean operations: a mask would be drawn at the barn's small scale and look blurred in browsers,
    and separate shapes leave hairline seams between façade and side."""
    facade, side, door, window, tower, roof, cone = symbol
    op = lambda one, two, kind: pathops.op(one, two, kind)
    barn = pathops.Path()
    for e in symbol:
        barn = op(barn, outline(e), pathops.PathOp.UNION)
    # The gap: a 0.7 stroke round the roof and the cone, less the shape itself, so it falls only outside it.
    for e in (roof, cone):
        ring = outline(e)
        ring.stroke(0.7, pathops.LineCap.BUTT_CAP, pathops.LineJoin.ROUND_JOIN, 4)
        ring.convertConicsToQuads()  # round joins come out as conics, which boolean operations do not take
        barn = op(barn, op(ring, outline(e), pathops.PathOp.DIFFERENCE), pathops.PathOp.DIFFERENCE)
    # The door runs a little past the façade's slanted foot, so no sliver of wall is left under it.
    for hole in (op(outline(door), outline(door, dy=1.5), pathops.PathOp.UNION), outline(window)):
        barn = op(barn, hole, pathops.PathOp.DIFFERENCE)
    pen = SVGPathPen(None)
    barn.draw(pen)
    g = ET.Element(f"{{{ns}}}g")
    ET.SubElement(g, f"{{{ns}}}path", {"d": pen.getCommands(), "fill": color})
    return g

def bounds(groups):
    probe = rasterize(svg_bytes(321.118, 207.732, groups), 3211)
    return [v / 10 for v in probe.getchannel("A").getbbox()]

def ink_middle(groups):
    """Height of the ink's centroid: the drawing's optical middle, below its box's when the top is thin."""
    alpha = np.asarray(rasterize(svg_bytes(321.118, 207.732, groups), 3211).getchannel("A"), dtype=float)
    return (alpha.sum(axis=1) * np.arange(alpha.shape[0])).sum() / alpha.sum() / 10

# The card already sets barn, name and tagline in place; stacked lockups keep those positions.
# Horizontal lockups centre the text on the barn's optical middle: the tower's cone raises its box, not its weight.
# The name sits beside the barn, cap height at 60% of the barn.
sx0, sy0, sx1, sy1 = bounds([group(symbol, "")])
wx0, wy0, wx1, wy1 = bounds([group(wordmark, "")])
middle = ink_middle([group(symbol, "")])
k = 0.6 * (sy1 - sy0) / (wy1 - wy0)
beside = f"translate({sx1 + 0.3 * (sy1 - sy0):.3f} {middle:.3f}) scale({k:.4f}) translate({-wx0:.3f} {-(wy0 + wy1) / 2:.3f})"
for variant, color, tag in [("color", "#347265", "#347265"), ("reversed", "#ffffff", "#f0cda2")]:
    write(f"paiol-stacked-{variant}", [group(symbol, ""), group(wordmark, "", color), group(tagline, "", tag)])
    write(f"paiol-horizontal-{variant}", [group(symbol, ""), group(wordmark, beside, color)])
# For signs: name and tagline set to the same width beside the barn, the pair as tall as fits centred on the
# barn's optical middle, so the tagline shares the barn's base.
tx0, ty0, tx1, ty1 = bounds([group(tagline, "")])
wordmark_ratio, tagline_ratio = (wy1 - wy0) / (wx1 - wx0), (ty1 - ty0) / (tx1 - tx0)
pair = 2 * (sy1 - middle)
text_width = pair / (wordmark_ratio * 1.12 + tagline_ratio)
left = sx1 + 0.3 * (sy1 - sy0)
kw, kt = text_width / (wx1 - wx0), text_width / (tx1 - tx0)
name_top = sy1 - pair
name_at = f"translate({left:.3f} {name_top:.3f}) scale({kw:.4f}) translate({-wx0:.3f} {-wy0:.3f})"
tag_at = f"translate({left:.3f} {sy1:.3f}) scale({kt:.4f}) translate({-tx0:.3f} {-ty1:.3f})"
for variant, color, tag in [("color", "#347265", "#347265"), ("reversed", "#ffffff", "#f0cda2")]:
    write(f"paiol-horizontal-tagline-{variant}", [group(symbol, ""), group(wordmark, name_at, color), group(tagline, tag_at, tag)])
write("paiol-symbol", [group(symbol, "")])
# Tints at 35% and 60% of the ink over white.
for name, color, light, mid in [("green", "#347265", "#b8cec9", "#85aaa3"), ("black", "#000000", "#a6a6a6", "#666666")]:
    write(f"paiol-symbol-{name}", [mono_symbol(color, light, mid)])
    write(f"paiol-horizontal-{name}", [mono_symbol(color, light, mid), group(wordmark, beside, color)])
write("paiol-symbol-white", [reversed_symbol("#ffffff")])
write("paiol-horizontal-white", [reversed_symbol("#ffffff"), group(wordmark, beside, "#ffffff")])

# Seals: the name around the barn, for stickers, stamps and round avatars. Drawn on a 1000-unit square.
# The text runs all the way round in caps of one height, with letter spacing that closes the circle; the centre
# sits on its visual weight (between its box centre and its ink centroid) with an even gap to the text.
SEAL, SEAL_R = 1000, 470
nunito = instancer.instantiateVariableFont(TTFont(Path(__file__).parent / "sources/Nunito-Variable.ttf"), {"wght": 700})
nunito_glyphs, nunito_cmap, nunito_cap = nunito.getGlyphSet(), nunito.getBestCmap(), nunito["OS/2"].sCapHeight

def ring(text, repeat, cap, color):
    """`text` and a dot, `repeat` times clockwise round the circle, the first centred at the top, caps `cap` tall."""
    k, r, c = cap / nunito_cap, SEAL_R - cap, SEAL / 2
    middle = r + cap / 2  # spacing is measured at half the cap height
    items = []
    for char in f"{text} • ":
        if char == "•":
            items.append((None, 0.42 * cap))
        else:
            name = nunito_cmap[ord(char)]
            items.append((name if char != " " else "", nunito["hmtx"][name][0] * k))
    items *= repeat
    track = (2 * math.pi * middle - sum(w for _, w in items)) / len(items)
    g = ET.Element(f"{{{ns}}}g", {"fill": color})
    at = -(sum(w for _, w in items[:len(text)]) + track * (len(text) - 1)) / 2
    for name, width in items:
        angle = math.degrees((at + width / 2) / middle)
        if name is None:
            ET.SubElement(g, f"{{{ns}}}circle", {"r": f"{width / 2:.3f}",
                "transform": f"translate({c} {c}) rotate({angle:.3f}) translate(0 {-middle:.3f})"})
        elif name:
            pen = SVGPathPen(nunito_glyphs)
            nunito_glyphs[name].draw(pen)
            ET.SubElement(g, f"{{{ns}}}path", {"d": pen.getCommands(),
                "transform": f"translate({c} {c}) rotate({angle:.3f}) translate({-width / 2:.3f} {-r:.3f}) scale({k:.5f} {-k:.5f})"})
        at += width + track
    return g

def centre_at(groups, radius):
    """The transform that sets card-coordinate groups in the middle of the seal, every inked pixel within `radius`."""
    alpha = np.asarray(rasterize(svg_bytes(321.118, 207.732, groups), 3211).getchannel("A"), dtype=float)
    ys, xs = np.nonzero(alpha > 8)
    weight = alpha[ys, xs]
    x = ((xs.min() + xs.max()) / 2 + (xs * weight).sum() / weight.sum()) / 2
    y = ((ys.min() + ys.max()) / 2 + (ys * weight).sum() / weight.sum()) / 2
    k = radius / np.sqrt((xs - x) ** 2 + (ys - y) ** 2).max() * 10
    return f"translate({SEAL / 2} {SEAL / 2}) scale({k:.4f}) translate({-x / 10:.3f} {-y / 10:.3f})"

def write_seal(name, parts, disc=None):
    """Square SVG cut to the circle; `disc` paints a full circle behind and shrinks the seal to 90% inside it."""
    box = "0 0 1000 1000" if disc else f"{SEAL / 2 - SEAL_R - 2} {SEAL / 2 - SEAL_R - 2} {2 * SEAL_R + 4} {2 * SEAL_R + 4}"
    svg = ET.Element(f"{{{ns}}}svg", {"viewBox": box, "width": "1000", "height": "1000", "role": "img"})
    ET.SubElement(svg, f"{{{ns}}}title").text = "Paiol Produtos Naturais"
    if disc:
        ET.SubElement(svg, f"{{{ns}}}circle", {"cx": "500", "cy": "500", "r": "500", "fill": disc})
        inner = ET.SubElement(svg, f"{{{ns}}}g", {"transform": "translate(500 500) scale(0.9) translate(-500 -500)"})
    else:
        inner = svg
    for part in parts:
        inner.append(part)
    data = ET.tostring(svg, encoding="utf-8", xml_declaration=True)
    (out / f"{name}.svg").write_bytes(data)
    rasterize(data, 1600).save(out / f"{name}.png", optimize=True)

def placed(transform, groups):
    g = ET.Element(f"{{{ns}}}g", {"transform": transform})
    for e in groups:
        g.append(copy.deepcopy(e))
    return g

# The seal with the name in the centre enlarges the barn 1.5 times over the name and brings it 15% closer.
lift = 0.15 * (wy0 - sy1)
over_name = f"translate({(wx0 + wx1) / 2:.3f} {sy1 + lift:.3f}) scale(1.5) translate({-(sx0 + sx1) / 2:.3f} {-sy1:.3f})"
inks = [("color", "#347265", None, lambda: group(symbol, ""), "#347265"),
        ("disc", "#f0cda2", "#347265", lambda: group(symbol, ""), "#ffffff"),
        ("black", "#000000", None, lambda: mono_symbol("#000000", "#a6a6a6", "#666666"), "#000000"),
        ("white", "#ffffff", None, lambda: reversed_symbol("#ffffff"), "#ffffff")]
for name, text, repeat, cap, gap, centre in [
        ("paiol-seal", "PAIOL PRODUTOS NATURAIS", 2, 52, 105, lambda barn, word: [barn]),
        ("paiol-seal-stacked", "PRODUTOS NATURAIS", 3, 50, 100, lambda barn, word: [placed(over_name, [barn]), group(wordmark, "", word)])]:
    # Measured once, on the colour version, so every ink lines up the same.
    at = centre_at(centre(group(symbol, ""), "#347265"), SEAL_R - cap - gap)
    for variant, ink, disc, barn, word in inks:
        write_seal(f"{name}-{variant}", [ring(text, repeat, cap, ink), placed(at, centre(barn(), word))], disc)

icon = Image.open(out / "paiol-symbol.png")
icon.thumbnail((128, 128))
icon.save(root / "src/app/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
manifest = {"name": "Paiol Produtos Naturais", "source": "Logo extraída do cartão de visitas original, com letras em curvas.",
    "colors": {"verde": "#347265", "vinho": "#8D313B", "palha": "#F0CDA2", "dourado": "#BFA574", "verdeEscuro": "#243C34", "branco": "#FFFFFF"},
    "typefaces": {"display": "Fraunces Black 900", "text": "Poppins 400–800"},
    "clearSpace": "A altura do símbolo em todos os lados; no selo, um décimo do diâmetro.",
    "minimumSizes": {"horizontal": "140 px / 35 mm", "symbol": "24 px / 8 mm", "seal": "100 px / 25 mm"},
    "offerFormats": {"feed": "1080 × 1080", "retrato": "1080 × 1350", "story": "1080 × 1920"}}
(out / "paiol-brand.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
with zipfile.ZipFile(out / "paiol-brand-kit.zip", "w", zipfile.ZIP_DEFLATED) as archive:
    for path in sorted(out.iterdir()):
        if path.suffix in (".svg", ".png", ".json", ".md", ".txt"):
            archive.write(path, path.name)
    for file in ["Poppins-400.ttf", "Poppins-500.ttf", "Poppins-600.ttf", "Poppins-700.ttf", "Poppins-800.ttf", "Fraunces-Variable.ttf"]:
        archive.write(root / "public/fonts" / file, f"fonts/{file}")
    archive.write(out / "paiol-marca/SKILL.md", "paiol-marca/SKILL.md")
print(f"Generated {len(list(out.glob('*.svg')))} SVGs, PNGs and the kit archive")
