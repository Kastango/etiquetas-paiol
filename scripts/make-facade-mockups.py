"""Storefront sign artwork and mockups on photos of the current signs.

Run after extract-brand-assets.py, which draws the logo lockups used here and rebuilds the kit ZIP this adds to:
uv run --with pillow --with numpy --with fonttools scripts/make-facade-mockups.py

Photos in scripts/sources: fachada-google.jpg (960 × 1280, Google Business profile) for the wall sign,
and placa-bandeira-streetview.png (Street View) for the projecting box sign. The corners below are
measured on these photos; other photos need their own corners.
"""
import io
import re
import subprocess
import zipfile
from pathlib import Path
import numpy as np
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFilter

root = Path(__file__).resolve().parents[1]
sources = Path(__file__).parent / "sources"
brand = root / "public/brand"
out = brand / "fachada"
out.mkdir(parents=True, exist_ok=True)
WHATSAPP = "WhatsApp (46) 92001-1470"


def homography(src, dst):
    """3 × 3 matrix taking the four src points to the four dst points."""
    rows = []
    for (x, y), (u, v) in zip(src, dst):
        rows.append([x, y, 1, 0, 0, 0, -u * x, -u * y, -u])
        rows.append([0, 0, 0, x, y, 1, -v * x, -v * y, -v])
    return np.linalg.svd(np.array(rows))[2][-1].reshape(3, 3)


def apply(h, x, y):
    p = h @ [x, y, 1]
    return p[0] / p[2], p[1] / p[2]


def lockup(file, x, y, height):
    """A logo SVG from public/brand nested at (x, y), drawing `height` tall (its file pads 8% per side)."""
    source = (brand / f"{file}.svg").read_text()
    view = re.search(r'viewBox="([^"]+)"', source).group(1)
    vw, vh = map(float, view.split()[2:])
    inner = re.sub(r"<title>.*?</title>", "", re.sub(r"^.*?<svg[^>]*>|</svg>\s*$", "", source, flags=re.S))
    box_h = height * 1.16
    box_w = box_h * vw / vh
    return f'<svg x="{x - box_w / 2:.1f}" y="{y - box_h / 2:.1f}" width="{box_w:.1f}" height="{box_h:.1f}" viewBox="{view}">{inner}</svg>'


def text_path(text, font_file, size, centre_x, baseline, fill):
    """Text as outlines, so print shops need no fonts installed."""
    font = TTFont(root / "public/fonts" / font_file)
    glyphs, cmap = font.getGlyphSet(), font.getBestCmap()
    scale = size / font["head"].unitsPerEm
    width = sum(glyphs[cmap[ord(c)]].width for c in text) * scale
    pen, x = SVGPathPen(glyphs), centre_x - width / 2
    for c in text:
        name = cmap[ord(c)]
        glyphs[name].draw(TransformPen(pen, (scale, 0, 0, -scale, x, baseline)))
        x += glyphs[name].width * scale
    return f'<path fill="{fill}" d="{pen.getCommands()}"/>'


def svg(width, height, title, body):
    return (f'<?xml version="1.0" encoding="utf-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" '
            f'width="{width}mm" height="{height}mm"><title>{title}</title>{body}</svg>')


def rasterize(data, width):
    png = subprocess.run(["rsvg-convert", "-w", str(width)], input=data.encode(), capture_output=True, check=True).stdout
    return Image.open(io.BytesIO(png)).convert("RGB")


def place(photo, art, quad, light_quad=None, blur=0.0, hazy=False):
    """
    Warps art onto quad. The light comes from the bright parts of the old sign (light_quad, default
    quad): a plane fitted to their brightness, so the new panel keeps the photo's light without
    picking up the old letters or the wall around a larger panel. A clean new panel is brighter than
    a weathered one, so the light is normalised; in a hazy photo (hazy=True) it is kept as measured.
    """
    scale = 3  # supersample for clean edges
    big = photo.resize((photo.width * scale, photo.height * scale), Image.LANCZOS)
    corners = [(0, 0), (art.width, 0), (art.width, art.height), (0, art.height)]
    # PIL maps each output pixel back to the art, so the matrix goes from the photo to the art.
    to_art = homography([(x * scale, y * scale) for x, y in quad], corners)
    coeffs = tuple((to_art / to_art[2, 2]).flatten()[:8])
    warped = art.transform(big.size, Image.PERSPECTIVE, coeffs, Image.BICUBIC)
    mask = Image.new("L", art.size, 255).transform(big.size, Image.PERSPECTIVE, coeffs, Image.BICUBIC)
    lum = np.asarray(big.convert("L"), dtype=np.float32)
    ys, xs = np.mgrid[0:big.height, 0:big.width]
    old = Image.new("L", big.size, 0)
    ImageDraw.Draw(old).polygon([(x * scale, y * scale) for x, y in (light_quad or quad)], fill=255)
    inside = np.asarray(old) > 0
    bright = inside & (lum > np.percentile(lum[inside], 60))
    a = np.c_[xs[bright], ys[bright], np.ones(bright.sum())]
    plane = np.linalg.lstsq(a, lum[bright], rcond=None)[0]
    light = (plane[0] * xs + plane[1] * ys + plane[2]) / 255
    if not hazy:
        light = light / np.percentile(light[np.asarray(mask) > 128], 95)
    light = np.clip(light, 0.55 if hazy else 0.82, 1.0)[..., None]
    lit = Image.fromarray((np.asarray(warped, dtype=np.float32) * light).astype(np.uint8))
    if blur:
        lit = lit.filter(ImageFilter.GaussianBlur(blur * scale))
    big.paste(lit, (0, 0), mask)
    return big.resize(photo.size, Image.LANCZOS)


def repaint(photo, rgb=(52, 114, 101)):
    """Recolour the turquoise wall and awning in Verde Paiol, keeping their shading."""
    hsv = np.asarray(photo.convert("HSV"), dtype=np.float32)
    h, s, v = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255, hsv[..., 2] / 255
    weight = np.clip((s - 0.3) / 0.1, 0, 1) * np.clip(1 - np.abs(h - 172) / 14, 0, 1)
    weight = np.asarray(Image.fromarray((weight * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5)), dtype=np.float32)[..., None] / 255
    target = Image.new("RGB", (1, 1), rgb).convert("HSV").getpixel((0, 0))
    shade = np.clip(v / 0.66, 0, 1.5)  # 0.66: typical brightness of the wall in this photo
    painted = np.stack([np.full_like(h, target[0]), np.full_like(h, target[1]), np.clip(target[2] * shade, 0, 255)], -1)
    painted = np.asarray(Image.fromarray(painted.astype(np.uint8), "HSV").convert("RGB"), dtype=np.float32)
    original = np.asarray(photo, dtype=np.float32)
    return Image.fromarray((original * (1 - weight) + painted * weight).astype(np.uint8))


COLOURS = {
    "branca": {"background": "#ffffff", "border": "#d9d4cb", "text": "#243c34", "suffix": "color"},
    "verde": {"background": "#347265", "border": "#2a5c51", "text": "#ffffff", "suffix": "reversed"},
}

# --- Wall sign -------------------------------------------------------------------------------------
# Corners of the current sign, clockwise from top left. Taking it as 4 × 1 m defines the wall's plane;
# the new panel extends that plane over the empty wall, clear of the roof line and of the awning.
OLD_SIGN = [(187.5, 317.5), (630, 150), (629, 296), (172.5, 431)]
WALL = homography([(0, 0), (4000, 0), (4000, 1000), (0, 1000)], OLD_SIGN)
X0, Y0, X1, Y1 = -850, -355, 4850, 1355
W, H = X1 - X0, Y1 - Y0  # 5700 × 1710 mm, 10:3
NEW_SIGN = [apply(WALL, x, y) for x, y in [(X0, Y0), (X1, Y0), (X1, Y1), (X0, Y1)]]


def wall_sign(background, border, text, suffix):
    # The logo drawing is half the panel height: a quarter above and below, as much as half a barn.
    body = (f'<rect width="{W}" height="{H}" fill="{background}"/>'
            f'<rect x="15" y="15" width="{W - 30}" height="{H - 30}" fill="none" stroke="{border}" stroke-width="30"/>'
            + lockup(f"paiol-horizontal-tagline-{suffix}", W / 2, H / 2, H * 0.5))
    return svg(W, H, "Placa de fachada Paiol, 5,7 × 1,7 m", body)


# --- Projecting box sign ---------------------------------------------------------------------------
# A square light box on the column by the door, seen from the side: its front face and the box side.
BOX_FRONT = [(294, 284), (462, 260), (462, 579), (294, 597)]
BOX_SIDE = [(462, 260), (571, 258), (572, 591), (462, 579)]
S = 800  # mm, square


def box_sign(background, border, text, suffix):
    body = (f'<rect width="{S}" height="{S}" fill="{background}"/>'
            f'<rect x="8" y="8" width="{S - 16}" height="{S - 16}" fill="none" stroke="{border}" stroke-width="16"/>'
            + lockup(f"paiol-stacked-{suffix}", S / 2, S * 0.42, S * 0.6)
            + text_path(WHATSAPP, "Poppins-600.ttf", S * 0.052, S / 2, S * 0.86, text))
    return svg(S, S, "Placa de bandeira Paiol, 80 × 80 cm", body)


def paint_side(photo, quad, rgb):
    """Recolour the box side in the panel colour, keeping the photo's shading."""
    mask = Image.new("L", photo.size, 0)
    ImageDraw.Draw(mask).polygon(quad, fill=255)
    lum = np.asarray(photo.convert("L"), dtype=np.float32)[..., None] / 255
    inside = np.asarray(mask) > 0
    shade = lum / np.percentile(lum[inside], 90)
    painted = np.clip(np.array(rgb, dtype=np.float32) * shade, 0, 255).astype(np.uint8)
    result = photo.copy()
    result.paste(Image.fromarray(painted), (0, 0), mask.filter(ImageFilter.GaussianBlur(0.7)))
    return result


facade = Image.open(sources / "fachada-google.jpg").convert("RGB")
facade_crop = (0, 0, facade.width, 1000)  # building and sign, without the sidewalk
facade.crop(facade_crop).save(out / "fachada-atual.jpg", quality=88)
street = Image.open(sources / "placa-bandeira-streetview.png").convert("RGB")
street_crop = (130, 120, 760, 760)
street.crop(street_crop).save(out / "bandeira-atual.jpg", quality=90)

for name, colours in COLOURS.items():
    data = wall_sign(**colours)
    (out / f"placa-{name}.svg").write_text(data)
    art = rasterize(data, 2400)
    art.save(out / f"placa-{name}.png", optimize=True)
    place(facade, art, NEW_SIGN, OLD_SIGN).crop(facade_crop).save(out / f"fachada-placa-{name}.jpg", quality=88)
    if name == "branca":
        place(repaint(facade), art, NEW_SIGN, OLD_SIGN).crop(facade_crop).save(out / "fachada-verde-paiol.jpg", quality=88)

    data = box_sign(**colours)
    (out / f"bandeira-{name}.svg").write_text(data)
    art = rasterize(data, 1200)
    art.save(out / f"bandeira-{name}.png", optimize=True)
    base = street if name == "branca" else paint_side(street, BOX_SIDE, (52, 114, 101))
    # Street View is soft; a little blur keeps the new face from looking pasted on.
    place(base, art, BOX_FRONT, blur=0.6, hazy=True).crop(street_crop).save(out / f"bandeira-{name}.jpg", quality=90)

with zipfile.ZipFile(brand / "paiol-brand-kit.zip", "a", zipfile.ZIP_DEFLATED) as archive:
    names = set(archive.namelist())
    for path in sorted(out.iterdir()):
        if f"fachada/{path.name}" not in names:
            archive.write(path, f"fachada/{path.name}")
print(f"Sign artwork and mockups in {out.relative_to(root)}")
