"""Extract the complete Solis model catalogue from solistractor.nl.

usage: python scrape_models.py <out.json>

Reads /modellen/ (category, tagline, width per model) and every model page:
hero, key facts, intro + highlights, the configurator definition (the JSON
the site's own configurator runs on), the work/use section, the spec table
and the downloads. Text is kept exactly as published.
"""
import json
import re
import sys
import time
import urllib.request

from bs4 import BeautifulSoup

SITE = 'https://www.solistractor.nl'
SLUGS = ['s16', 's20', 's22', 's26', 's26-shuttle-xl', 'h26', 's50', 's60', 'n75', 's75', 'n90', 's90']


def get(path):
    req = urllib.request.Request(SITE + path, headers={'User-Agent': 'Mozilla/5.0 (concept redesign research)'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode('utf-8')


def text(el):
    return re.sub(r'\s+', ' ', el.get_text(' ', strip=True)).strip() if el else ''


def pairs(container):
    """<article><span>label</span><strong>value</strong></article> rows."""
    out = []
    if not container:
        return out
    for art in container.find_all('article'):
        k, v = art.find('span'), art.find('strong')
        if k and v:
            out.append({'label': text(k), 'value': text(v)})
    return out


# The listing: one card per model, in the site's order.
listing = BeautifulSoup(get('/modellen/'), 'lxml')
cards = {}
for a in listing.select('a[href*="/modellen/"]'):
    href = a.get('href', '')
    m = re.search(r'/modellen/([a-z0-9-]+)/?$', href)
    if not m or m.group(1) not in SLUGS:
        continue
    card = a.find_parent('article') or a.find_parent('li') or a
    t = text(card)
    if 'VANAFPRIJS' not in t.upper() and 'Vanafprijs' not in t:
        continue
    cards.setdefault(m.group(1), card)

KEEP_CONTROL = ('key', 'type', 'label', 'note', 'max', 'unit', 'price', 'onRequest', 'priceRule', 'labelRule', 'when', 'rule', 'hidden')
KEEP_OPTION = ('value', 'label', 'note', 'detail', 'price', 'priceRule', 'labelRule', 'onRequest', 'when', 'rule', 'isDefault', 'image')


def prune(cfg):
    steps = []
    for step in cfg.get('steps', []):
        controls = []
        for c in step.get('controls', []):
            cc = {k: c[k] for k in KEEP_CONTROL if k in c and c[k] not in ('', [], None, False, 0) or k in ('key', 'type')}
            cc['options'] = [
                {k: o[k] for k in KEEP_OPTION if k in o and (o[k] not in ('', [], None, False) or k == 'price')}
                for o in c.get('options', [])
            ]
            controls.append(cc)
        steps.append({'title': step.get('title', ''), 'controls': controls})
    return {k: cfg[k] for k in cfg if k not in ('steps', 'model')} | {'steps': steps}


models = []
for slug in SLUGS:
    html = get(f'/modellen/{slug}/')
    soup = BeautifulSoup(html, 'lxml')
    main = soup.find('main')
    hero = main.select_one('.series-hero')
    intro = main.select_one('.series-intro')
    work = main.select_one('.s75-work-section')
    specs_head = main.select_one('.wp-block-solis-model-specs')
    configurator = main.select_one('.model-configurator')

    cfg = None
    for s in soup.find_all('script'):
        raw = (s.string or '').strip()
        if raw.startswith('{') and '"steps"' in raw:
            cfg = json.loads(raw)
            break

    card = cards.get(slug)
    card_lines = [l for l in (card.get_text('\n', strip=True).split('\n') if card else []) if l]

    hero_ps = [p for p in hero.find_all('p') if 'eyebrow' not in (p.get('class') or [])] if hero else []
    intro_ps = [p for p in intro.find_all('p') if 'eyebrow' not in (p.get('class') or [])] if intro else []
    model = {
        'slug': slug,
        'url': f'{SITE}/modellen/{slug}/',
        'title': text(soup.find('title')),
        'metaDescription': (soup.find('meta', attrs={'name': 'description'}) or {}).get('content', ''),
        'card': card_lines,
        'hero': {
            'eyebrow': text(hero.select_one('.eyebrow')) if hero else '',
            'headline': text(hero.find('h1')) if hero else '',
            'text': text(hero_ps[0]) if hero_ps else '',
        },
        'keyFacts': pairs(main.select_one('.series-keyfacts')),
        'intro': {
            'eyebrow': text(intro.select_one('.eyebrow')) if intro else '',
            'title': text(intro.find('h2')) if intro else '',
            'text': text(intro_ps[0]) if intro_ps else '',
            'checks': [text(s) for s in intro.select('.s75-checks span')] if intro else [],
            'footnote': text(intro.select_one('.s75-footnote')) if intro else '',
            'image': (intro.find('img') or {}).get('src', '') if intro else '',
        },
        'work': {
            'eyebrow': text(work.select_one('.eyebrow')) if work else '',
            'title': text(work.find('h2')) if work else '',
            'text': text(next((p for p in work.find_all('p') if 'eyebrow' not in (p.get('class') or [])), None)) if work else '',
            'items': [
                {'title': text(h), 'text': text(h.find_next('p'))} for h in (work.find_all('h3') if work else [])
            ],
        },
        'specsNote': text(specs_head.find('p', class_=lambda c: c != 'eyebrow') if specs_head else None),
        'specs': pairs(main.select_one('.series-specs')),
        'downloads': [
            {
                'label': text(a.find('span').find(string=True, recursive=False)) if a.find('span') else text(a),
                'meta': text(a.find('small')),
                'href': a.get('href', ''),
            }
            for a in main.select('.s75-downloads a')
        ],
        'configuratorNote': '',
        'configurator': prune(cfg) if cfg else None,
    }
    if configurator:
        notes = [text(s) for s in configurator.find_all(['small', 'p']) if 'prijslijst' in text(s).lower()]
        model['configuratorNote'] = notes[0] if notes else ''
    models.append(model)
    print(slug, len(html), 'config' if cfg else 'NO CONFIG', len(model['specs']), 'specs', file=sys.stderr)
    time.sleep(0.4)

with open(sys.argv[1], 'w', encoding='utf-8') as f:
    json.dump({'source': SITE + '/modellen/', 'models': models}, f, ensure_ascii=False, indent=1)
print('written', sys.argv[1], file=sys.stderr)
