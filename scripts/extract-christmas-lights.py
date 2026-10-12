"""The string of lights of the 2022 Christmas story, for the Christmas theme of offers and opening hours.

uv run --with psd-tools --with pillow --with numpy scripts/extract-christmas-lights.py --psd "/path/to/storie natal paiol.psd"

The PSD lays the bulbs over a screen-blended glow on the red band. Both are blended here over that red,
then the red is taken back out as transparency (colour to alpha), so the PNG keeps the glow and works on
the theme's red. The layer's big multiply shadow is left out: drawn alone it leaves a visible rectangle.
"""
import argparse
from pathlib import Path
import numpy as np
from PIL import Image
from psd_tools import PSDImage

parser = argparse.ArgumentParser()
parser.add_argument("--psd", type=Path, required=True)
args = parser.parse_args()
out = Path(__file__).resolve().parents[1] / "public/seasons/natal-luzes.png"
out.parent.mkdir(parents=True, exist_ok=True)

RED = np.array([239, 76, 79], dtype=float) / 255  # the band of the 2022 Christmas posts
psd = PSDImage.open(args.psd)
layers = {layer.name: layer for layer in psd.descendants() if layer.visible and layer.kind == "pixel"}
size = psd.size

def pixels(layer):
    canvas = Image.new("RGBA", size)
    canvas.paste(layer.composite(), layer.bbox[:2])
    rgba = np.asarray(canvas, dtype=float) / 255
    return rgba[..., :3], rgba[..., 3:] * layer.opacity / 255

base = np.broadcast_to(RED, (size[1], size[0], 3)).copy()
glow, glow_alpha = pixels(layers["Light Glows"])
base = base * (1 - glow_alpha) + (1 - (1 - base) * (1 - glow)) * glow_alpha
bulbs, bulbs_alpha = pixels(layers["Light Bulbs"])
base = base * (1 - bulbs_alpha) + bulbs * bulbs_alpha

# Colour to alpha: the least opacity at which some colour over the red gives this pixel.
reach = np.where(base >= RED, 1 - RED, RED)
alpha = np.clip((np.abs(base - RED) / reach).max(axis=2, keepdims=True), 0, 1)
colour = np.where(alpha > 0, RED + (base - RED) / np.maximum(alpha, 1e-6), 0)
image = Image.fromarray(np.uint8(np.round(np.concatenate([np.clip(colour, 0, 1), alpha], axis=2) * 255)), "RGBA")
image = image.crop(image.getchannel("A").point(lambda a: 255 if a > 4 else 0).getbbox())
image.save(out, optimize=True)
print(f"{out.relative_to(out.parents[2])}: {image.size[0]} × {image.size[1]}")
