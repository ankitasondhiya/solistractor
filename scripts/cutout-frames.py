"""Key the studio out of the studio edition's frames (the hero at `/studio`).

usage: python scripts/cutout-frames.py <png_dir> public/frames/studio/lg "1280,public/frames/studio/sm:720"

<png_dir> holds frame-001.png ... extracted from the source film, e.g.
  ffmpeg -i film.mp4 -vf "delogo=x=1130:y=570:w=60:h=60,fps=16" png/frame-%03d.png
Append frame numbers to process only those (for testing).

The studio is a smooth, unsaturated grey gradient. Per frame:
  1. model the background per row as a line between the left and right edge
     strips (the machine never reaches the outer 2% of the frame);
  2. mark studio-like pixels (close to that model, unsaturated);
  3. keep the studio regions connected to the border, plus enclosed pockets
     that are flat and very close to the model (the gap inside the safety
     frame), but not light machine parts such as the rims;
  4. everything else is the machine; studio pixels darker than the model
     become a soft black shadow.
"""
import os
import sys

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

src, out = sys.argv[1], sys.argv[2]
width = int(sys.argv[3].split(",")[0])
only = [int(a) for a in sys.argv[4:]]
os.makedirs(out, exist_ok=True)

STRIP = 22
T_DIFF = 20.0      # max channel distance from the model to count as studio
T_SAT = 15.0       # max saturation of studio pixels
T_SHADOW = 85.0    # how much darker than the model a floor shadow may be
SHADOW_SCALE = 130.0
SHADOW_MAX = 0.5


def border_connected(mask):
    labels, _ = ndimage.label(mask, structure=np.ones((3, 3)))
    border = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    return np.isin(labels, border[border > 0])


def process(path):
    img = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    h, w, _ = img.shape
    sat = img.max(axis=2) - img.min(axis=2)
    luma = img.mean(axis=2)

    # Pass 1: a coarse studio model from the edge strips.
    left = ndimage.median_filter(np.median(img[:, :STRIP], axis=1), size=(31, 1))
    right = ndimage.median_filter(np.median(img[:, w - STRIP:], axis=1), size=(31, 1))
    t = np.linspace(0, 1, w, dtype=np.float32)[None, :, None]
    bg1 = left[:, None, :] * (1 - t) + right[:, None, :] * t
    diff1 = np.abs(img - bg1).max(axis=2)
    lighter1 = (luma - bg1.mean(axis=2)) > 0
    sure = border_connected(((diff1 < T_DIFF) | lighter1) & (sat < T_SAT))

    # Pass 2: the real studio, interpolated under the machine from the pixels
    # pass 1 was sure of (normalised convolution).
    weight = ndimage.gaussian_filter(sure.astype(np.float32), 40)
    bg2 = np.stack(
        [ndimage.gaussian_filter(img[..., c] * sure, 40) for c in range(3)], axis=2
    ) / np.maximum(weight, 1e-4)[..., None]
    bg2 = np.where((weight > 0.02)[..., None], bg2, bg1)
    diff = np.abs(img - bg2).max(axis=2)
    bg_luma = bg2.mean(axis=2)
    darker = bg_luma - luma
    # Floor shadows only exist on the floor; above it, darker means machine.
    yy = np.linspace(0, 1, h, dtype=np.float32)[:, None]
    floor = np.clip((yy - 0.42) / 0.14, 0, 1) * np.ones((1, w), dtype=np.float32)

    studio = (diff < 16) & (sat < T_SAT)
    lighter = ((luma - bg_luma) > 0) & (sat < T_SAT)
    shadow_like = (sat < T_SAT + 4) & (darker > 0) & (darker < T_SHADOW) & (floor > 0.5)
    background = border_connected(studio | lighter | shadow_like)

    # Enclosed pockets of studio — the room seen through the safety frame —
    # are flat and match the interpolated studio closely; the rims do not.
    pockets, m = ndimage.label((diff < 12) & (sat < 12) & ~background)
    if m:
        idx = np.arange(1, m + 1)
        mean_diff = ndimage.mean(diff, pockets, idx)
        std_luma = ndimage.standard_deviation(luma, pockets, idx)
        area = ndimage.sum(np.ones_like(luma), pockets, idx)
        keep = idx[(mean_diff < 7) & (std_luma < 4.5) & (area > 40)]
        background |= np.isin(pockets, keep)

    # Bright floor fenced in by a tyre's dark contact shadow: on the floor,
    # unsaturated and at least as light as the studio there. Rims are darker
    # than the floor, so they stay.
    glare, g = ndimage.label((luma > bg_luma - 3) & (sat < 12) & (floor > 0.5) & ~background)
    if g:
        idx = np.arange(1, g + 1)
        area = ndimage.sum(np.ones_like(luma), glare, idx)
        background |= np.isin(glare, idx[area > 12])

    fg = ~background
    fg = ndimage.binary_opening(fg, iterations=1)
    # Tiny specks of "studio" inside the machine are glints, not holes.
    specks, k = ndimage.label(~fg)
    if k:
        sizes = ndimage.sum(np.ones_like(luma), specks, np.arange(1, k + 1))
        small = np.arange(1, k + 1)[sizes < 30]
        fg |= np.isin(specks, small)
    # The outermost pixel is half studio; trimming it removes the pale fringe
    # that would otherwise outline the machine on a warmer page.
    fg = ndimage.binary_erosion(fg, iterations=1)
    fg_soft = np.asarray(
        Image.fromarray((fg * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8)),
        dtype=np.float32,
    ) / 255.0
    # Unmix the studio from the feathered edge: observed = a*fg + (1-a)*studio.
    edge = (fg_soft > 0.02) & (fg_soft < 0.98)
    a = np.maximum(fg_soft, 0.35)[..., None]
    unmixed = np.clip((img - (1 - a) * bg2) / a, 0, 255)
    img = np.where(edge[..., None], unmixed, img)

    shadow = np.clip(darker / SHADOW_SCALE, 0, SHADOW_MAX) * (~fg) * floor
    shadow = ndimage.gaussian_filter(shadow, 1.5)

    alpha = np.maximum(fg_soft, shadow)
    shadow_rgb = np.array([16, 22, 34], dtype=np.float32)
    weight = np.where(alpha > 0, fg_soft / np.maximum(alpha, 1e-6), 0)[..., None]
    rgb = img * weight + shadow_rgb * (1 - weight)

    rgba = np.dstack([np.clip(rgb, 0, 255), np.clip(alpha * 255, 0, 255)]).astype(np.uint8)
    return Image.fromarray(rgba, 'RGBA')


# usage now: cutout.py <src> <out_dir> <width>[,<out_dir2>:<width2>] [frames...]
targets = [(out, width)]
if ',' in sys.argv[3]:
    first, *rest = sys.argv[3].split(',')
    targets = [(out, int(first))] + [(p.rsplit(':', 1)[0], int(p.rsplit(':', 1)[1])) for p in rest]
for d, _ in targets:
    os.makedirs(d, exist_ok=True)

files = sorted(f for f in os.listdir(src) if f.endswith('.png'))
for f in files:
    num = int(f.split('-')[1].split('.')[0])
    if only and num not in only:
        continue
    im = process(os.path.join(src, f))
    for d, tw in targets:
        frame = im if tw == im.width else im.resize((tw, round(im.height * tw / im.width)), Image.LANCZOS)
        frame.save(os.path.join(d, f.replace('.png', '.webp')), 'WEBP', quality=62, alpha_quality=92, method=5)
print('done', len(only) or len(files))
