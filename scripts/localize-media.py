#!/usr/bin/env python3
"""
Copies every image and PDF the site uses from solistractor.nl into
public/media/solis/ and points the data at the copies, so nothing is
hot-linked and no click leaves for the old site.

    python scripts/localize-media.py

Reads the data files (src/data/catalogue.json, src/data/pages.json) and the
model list (src/data/models.ts, src/data/links.ts), downloads each
wp-content URL once to public/media/solis/<same path>, and rewrites:

  https://www.solistractor.nl/wp-content/…   ->  /media/solis/…
  https://www.solistractor.nl/modellen/<m>/  ->  /#model-<m>   (the model's sheet)
  https://www.solistractor.nl/garantie/      ->  /garantie     (and the other pages)

src/data/links.ts sets MEDIA = '/media/solis', so the model photos built from
it follow automatically. Re-running only downloads what is missing.

Large PNG/JPEG photographs (over 250 KB) are re-encoded as WebP — at most
1600 px wide, transparency kept — and the data is pointed at the WebP
(ui-ux-pro-max: image-optimization). That step needs Pillow and is skipped
without it; everything else is standard library.
"""
from __future__ import annotations

import json
import os
import re
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = 'https://www.solistractor.nl'
UA = 'Mozilla/5.0 (compatible; solis-redesign-media-sync)'
OUT = os.path.join(ROOT, 'public', 'media', 'solis')
LOCAL = '/media/solis'

ASSET = re.compile(r'https?://(?:www\.)?solistractor\.nl/wp-content/([^"\'\s)`]+)')
PAGE_MAP = {
    'over-ons': '/over-ons',
    'informatie': '/informatie',
    'klantenservice': '/klantenservice',
    'garantie': '/garantie',
    'garantieformulier': '/garantie/registreren',
    'contact': '/contact',
    'privacybeleid': '/privacybeleid',
    'cookiebeleid': '/cookiebeleid',
    'dealers': '/#dealers',
    'modellen': '/#modellen',
    'keuzehulp': '/#keuzehulp',
    'vergelijken': '/#vergelijken',
    'demonstratie': '/#demo',
    'acties': '/acties',
    'bedankt': '/bedankt',
}


def download(rel: str) -> int:
    """Fetches wp-content/<rel> once; returns its size."""
    rel = rel.split('?')[0]
    dest = os.path.join(OUT, rel)
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        return os.path.getsize(dest)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    url = f'{SITE}/wp-content/{urllib.request.quote(rel)}'
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read()
    with open(dest, 'wb') as f:
        f.write(data)
    return len(data)


def optimise(rel: str) -> str | None:
    """A big PNG/JPEG as WebP beside it; returns the WebP's path, or None."""
    if not rel.lower().endswith(('.png', '.jpg', '.jpeg')):
        return None
    src = os.path.join(OUT, rel)
    dst_rel = os.path.splitext(rel)[0] + '.webp'
    dst = os.path.join(OUT, dst_rel)
    if os.path.exists(dst):
        return dst_rel
    if not os.path.exists(src) or os.path.getsize(src) < 250_000:
        return None
    try:
        from PIL import Image
    except ImportError:
        return None
    with Image.open(src) as im:
        if im.width > 1600:
            im.thumbnail((1600, 10_000))
        im.save(dst, 'WEBP', quality=82, method=6)
    print(f'webp   {os.path.getsize(src) // 1024:>6} KB -> {os.path.getsize(dst) // 1024:>5} KB  {dst_rel}', file=sys.stderr)
    os.remove(src)  # the original is no longer referenced
    return dst_rel


def rewrite_pages(text: str) -> str:
    def page(m: re.Match) -> str:
        path = m.group(1).strip('/')
        if path.startswith('modellen/'):
            return f'/#model-{path.split("/")[1]}'
        if path.startswith('dealers/'):
            return f'/{path}'
        return PAGE_MAP.get(path, '/')

    return re.sub(r'https?://(?:www\.)?solistractor\.nl/(?!wp-content/)([a-z0-9/-]*)', page, text)


def main() -> None:
    found: set[str] = set()

    data_files = [os.path.join(ROOT, 'src', 'data', f) for f in ('catalogue.json', 'pages.json')]
    for path in data_files:
        found.update(m.group(1) for m in ASSET.finditer(open(path, encoding='utf-8').read()))

    # Model photos are built from MEDIA in models.ts: upload('s16-1') and literal paths.
    models_ts = open(os.path.join(ROOT, 'src', 'data', 'models.ts'), encoding='utf-8').read()
    upload_fmt = re.search(r"const upload = \(file: string\) => `\$\{MEDIA\}/([^`]*)\$\{file\}([^`]*)`", models_ts)
    if upload_fmt:
        for name in re.findall(r"upload\('([^']+)'\)", models_ts):
            found.add(f'{upload_fmt.group(1)}{name}{upload_fmt.group(2)}')
    for ts in ('models.ts', 'links.ts'):
        src = open(os.path.join(ROOT, 'src', 'data', ts), encoding='utf-8').read()
        found.update(m.group(1).lstrip('/') for m in re.finditer(r'\$\{MEDIA\}(/[^`\'"$]+)`', src))

    total = 0
    for rel in sorted(found):
        try:
            size = download(rel)
            total += size
            print(f'{size // 1024:>6} KB  {rel}', file=sys.stderr)
        except Exception as e:  # keep going; report what failed
            print(f'FAILED  {rel}: {e}', file=sys.stderr)
    print(f'{len(found)} files, {total / 1_048_576:.1f} MB in public/media/solis', file=sys.stderr)

    for path in data_files:
        text = open(path, encoding='utf-8').read()
        text = ASSET.sub(lambda m: f'{LOCAL}/{m.group(1)}', text)
        text = rewrite_pages(text)
        # Point big photographs at their WebP versions.
        for rel in sorted(set(re.findall(rf'{re.escape(LOCAL)}/([^"\s]+\.(?:png|jpe?g))', text, re.I))):
            webp = optimise(rel)
            if webp:
                text = text.replace(f'{LOCAL}/{rel}', f'{LOCAL}/{webp}')
        with open(path, 'w', encoding='utf-8') as f:
            f.write(text)
        print('rewrote', os.path.relpath(path, ROOT), file=sys.stderr)


if __name__ == '__main__':
    main()
