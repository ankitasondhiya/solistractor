#!/usr/bin/env python3
"""
Rebuilds src/data/pages.json — the content of solistractor.nl's deeper pages
(about, information, service, warranty, warranty registration, contact,
privacy, cookies and the twenty dealer pages), so the redesign shows them
itself instead of sending readers away.

    python scripts/scrape-pages.py src/data/pages.json

Every page on the site is built from the same theme sections (a hero, then
sections of eyebrow + heading + text, an image, a grid of <article> cards and
buttons). This reads each <main> into that shape — blocks of plain text and
links, nothing executable — and maps every link to its place on this site:
pages to their new paths, "models" and "dealers" to the landing page's own
sections, PDFs and images to local copies (see scripts/localize-media.py).

Standard library only. The text is the site's own, as published.
"""
from __future__ import annotations

import json
import re
import sys
import urllib.request
from html.parser import HTMLParser

SITE = 'https://www.solistractor.nl'
UA = 'Mozilla/5.0 (compatible; solis-redesign-content-sync)'

# path on solistractor.nl -> path here
PAGES = {
    'over-ons': 'over-ons',
    'informatie': 'informatie',
    'klantenservice': 'klantenservice',
    'garantie': 'garantie',
    'garantieformulier': 'garantie/registreren',
    'contact': 'contact',
    'privacybeleid': 'privacybeleid',
    'cookiebeleid': 'cookiebeleid',
    'acties': 'acties',
    'bedankt': 'bedankt',
}

DEALERS = [
    'agrixpert', 'bosgra', 'bosmans-machines', 'geelink', 'hof-mechanisatie', 'hulst-de-krim', 'gebratech',
    'ks-machinery', 'vm-service', 'goedhart', 'folkertsma', 'fruit-tuin-park', 'pd-van-hemert', 'niels-lubbers',
    'van-vijfeijken', 'manshanden', 'nouws', 'arjan-van-lierop', 'van-der-mei', 'romox',
]

# Hero photographs are set in the theme's stylesheet, per hero class.
HERO_IMAGES = {
    'about-hero': '/wp-content/themes/solis/assets/informatie/Solis-fabriek2-kleur.webp',
    'information-hero': '/wp-content/themes/solis/assets/informatie/Solis-informatie-hero-foto.webp',
    'service-hero': '/wp-content/themes/solis/assets/heroes/service-fotograaf.webp',
    'warranty-hero': '/wp-content/themes/solis/assets/heroes/garantie-fotograaf.webp',
    'warranty-form-hero': '/wp-content/themes/solis/assets/heroes/garantieformulier-fotograaf.webp',
    'contact-hero': '/wp-content/themes/solis/assets/heroes/contact-fotograaf.webp',
    'privacy-hero': '/wp-content/themes/solis/assets/heroes/garantie-fotograaf.webp',
    'cookie-hero': '/wp-content/themes/solis/assets/heroes/contact-fotograaf.webp',
    'acties-hero': '/wp-content/themes/solis/assets/models/heroes-fotograaf/s22.webp',
}

# Dark (navy) sections in the theme.
DARK = {'about-scale', 'about-local', 'dealer-contact-section', 'warranty-check', 'service-fastlane', 'contact-strip'}

VOID = {'img', 'br', 'input', 'meta', 'link', 'source', 'hr', 'wbr', 'col', 'area', 'base', 'embed', 'param', 'track'}


class Node:
    def __init__(self, tag: str, attrs: dict, parent: 'Node | None'):
        self.tag, self.attrs, self.parent = tag, attrs, parent
        self.children: list['Node | str'] = []

    @property
    def cls(self) -> set[str]:
        return set((self.attrs.get('class') or '').split())

    def iter(self):
        for c in self.children:
            if isinstance(c, Node):
                yield c
                yield from c.iter()

    def find_all(self, pred):
        return [n for n in self.iter() if pred(n)]

    def first(self, pred):
        return next((n for n in self.iter() if pred(n)), None)

    def text(self, keep_breaks: bool = False) -> str:
        out: list[str] = []

        def walk(n):
            for c in n.children:
                if isinstance(c, str):
                    out.append(c)
                elif c.tag == 'br':
                    out.append('\n' if keep_breaks else ' ')
                elif c.tag not in ('script', 'style', 'svg', 'noscript'):
                    walk(c)

        walk(self)
        raw = ''.join(out)
        if keep_breaks:
            return '\n'.join(' '.join(line.split()) for line in raw.split('\n')).strip()
        return ' '.join(raw.split())

    def inside(self, pred) -> bool:
        p = self.parent
        while p is not None:
            if pred(p):
                return True
            p = p.parent
        return False


class Builder(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node('root', {}, None)
        self.cur = self.root

    def handle_starttag(self, tag, attrs):
        node = Node(tag, dict(attrs), self.cur)
        self.cur.children.append(node)
        if tag not in VOID:
            self.cur = node

    def handle_startendtag(self, tag, attrs):
        self.cur.children.append(Node(tag, dict(attrs), self.cur))

    def handle_endtag(self, tag):
        n = self.cur
        while n is not None and n.tag != tag:
            n = n.parent
        if n is not None and n.parent is not None:
            self.cur = n.parent

    def handle_data(self, data):
        self.cur.children.append(data)


def fetch(path: str) -> str:
    req = urllib.request.Request(f'{SITE}/{path}/', headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode('utf-8', errors='replace')


# ---------------------------------------------------------------------------
# Links: where each one points on this site
# ---------------------------------------------------------------------------
def map_href(href: str) -> dict:
    href = (href or '').strip()
    if href.startswith('tel:'):
        return {'kind': 'tel', 'href': href}
    if href.startswith('mailto:'):
        return {'kind': 'mail', 'href': href}
    if href.startswith('#'):
        return {'kind': 'anchor', 'href': href}
    if href.startswith('/?api=1'):  # relative Google Maps search links on dealer pages
        href = 'https://www.google.com/maps/search' + href
    m = re.match(r'https?://(www\.)?solistractor\.nl(/[^?#]*)?(\?[^#]*)?(#.*)?$', href)
    if not m:
        return {'kind': 'external', 'href': href}
    path = (m.group(2) or '/').strip('/')
    query = m.group(3) or ''
    if path.startswith('wp-content/'):
        return {'kind': 'file', 'href': f'{SITE}/{path}'}
    if path in ('', 'home'):
        return {'kind': 'internal', 'href': '/'}
    if path == 'modellen' or path.startswith('modellen/'):
        slug = path.split('/')[1] if '/' in path else ''
        return {'kind': 'internal', 'href': f'/#model-{slug}' if slug else '/#modellen'}
    if path in ('keuzehulp',):
        return {'kind': 'internal', 'href': '/#keuzehulp'}
    if path in ('vergelijken',):
        return {'kind': 'internal', 'href': '/#vergelijken'}
    if path in ('demo', 'demonstratie'):
        # "?model=s50" keeps its tractor: the old address picks it in the demo form (src/legacy.ts).
        model = re.search(r'[?&]model=([a-z0-9-]+)', query)
        return {'kind': 'internal', 'href': f'/demonstratie?model={model.group(1)}' if model else '/#demo'}
    if path == 'dealers':
        return {'kind': 'internal', 'href': '/#dealers'}
    if path.startswith('dealers/'):
        return {'kind': 'internal', 'href': f'/{path}'}
    if path.startswith('actie/'):  # a single promotion: its own page lists every one
        return {'kind': 'internal', 'href': '/acties'}
    if path in PAGES:
        return {'kind': 'internal', 'href': f'/{PAGES[path]}{query}'}
    return {'kind': 'internal', 'href': '/'}


def link(a: Node) -> dict:
    label = a.text().replace('→', '').replace('↓', '').strip()
    out = {'label': label, **map_href(a.attrs.get('href', ''))}
    cls = a.cls
    if 'button-primary' in cls:
        out['style'] = 'primary'
    elif 'button' in cls:
        out['style'] = 'secondary'
    elif 'text-link' in cls:
        out['style'] = 'text'
    return out


def img(n: Node) -> dict:
    src = n.attrs.get('src', '')
    if src.startswith('/'):
        src = SITE + src
    return {'src': src, 'alt': n.attrs.get('alt', '')}


# ---------------------------------------------------------------------------
# Sections → blocks
# ---------------------------------------------------------------------------
CARD = lambda n: n.tag in ('article', 'address', 'aside', 'figure', 'form', 'dl') or bool(
    n.cls & {'regional-contact-card', 'dealer-address', 'contact-sidebar', 'subnav', 'dealer-status'}
)


def parse_item(art: Node) -> dict:
    """One <article> card: a marker ("01", "1955", "Jaar 1", "50 pk"), a kicker,
    a title, its text, a stat label, an image, spec rows and links."""
    item: dict = {}
    if 'featured' in art.cls:
        item['featured'] = True
    heading = art.first(lambda n: n.tag in ('h2', 'h3', 'h4'))
    image = art.first(lambda n: n.tag == 'img')
    if image is not None:
        item['image'] = img(image)
    in_text = lambda n: n.inside(lambda q: q.tag in ('p', 'small', 'dl', 'h2', 'h3', 'h4', 'a', 'li'))
    spans = art.find_all(lambda n: n.tag == 'span' and not in_text(n) and n.text())
    strongs = art.find_all(lambda n: n.tag == 'strong' and not in_text(n) and n.text())
    if heading is not None:
        item['title'] = heading.text()
        lead = [x for x in spans + strongs if before(x, heading)]
        if lead:
            item['marker'] = lead[0].text()
    elif strongs:
        # a stat or a principle: <strong>150+</strong><span>landen</span>, or a
        # summary card: <span>Basis</span><strong>3 jaar …</strong><p>…</p>
        item['title'] = strongs[0].text()
        lead = [x for x in spans if before(x, strongs[0])]
        tail = [x for x in spans if not before(x, strongs[0])]
        if lead:
            item['marker'] = lead[0].text()
        if tail:
            item['label'] = tail[0].text()
    elif spans:
        item['title'] = spans[0].text()
    text: list[str] = []
    for para in art.find_all(lambda n: n.tag == 'p'):
        t = para.text(keep_breaks=True)
        if not t:
            continue
        if heading is not None and before(para, heading) and 'kicker' not in item:
            item['kicker'] = t
        else:
            text.append(t)
    if text:
        item['text'] = text
    smalls = [x.text(keep_breaks=True) for x in art.find_all(lambda n: n.tag == 'small') if x.text()]
    if smalls:
        item['note'] = smalls
    dl = art.first(lambda n: n.tag == 'dl')
    if dl is not None:
        rows, term = [], ''
        for el in dl.iter():
            if el.tag == 'dt':
                term = el.text()
            elif el.tag == 'dd':
                rows.append({'term': term, 'value': el.text()})
        item['rows'] = rows
    links = [link(a) for a in art.find_all(lambda n: n.tag == 'a' and n.attrs.get('href'))]
    if links:
        item['links'] = links
    return item


ORDER: dict[int, int] = {}


def before(a: Node, b: Node) -> bool:
    """Whether `a` comes before `b` in the document (ORDER is filled per page)."""
    return ORDER.get(id(a), 0) < ORDER.get(id(b), 0)


def parse_card(card: Node) -> dict:
    out: dict = {}
    eb = card.first(lambda n: n.tag == 'p' and 'eyebrow' in n.cls)
    if eb:
        out['eyebrow'] = eb.text()
    h = card.first(lambda n: n.tag in ('h2', 'h3'))
    if h:
        out['title'] = h.text()
    lines = []
    for p in card.find_all(lambda n: n.tag in ('p',) and 'eyebrow' not in n.cls):
        if p.first(lambda n: n.tag == 'a'):
            continue
        t = p.text(keep_breaks=True)
        if t:
            lines.append(t)
    if lines:
        out['lines'] = lines
    links = [link(a) for a in card.find_all(lambda n: n.tag == 'a' and n.attrs.get('href'))]
    if links:
        out['links'] = links
    return out


def money(text: str) -> str:
    """'€ 24.275' as published, or '' for 'n.v.t.' and empty cells."""
    t = re.sub(r'\s+', ' ', text).strip()
    return t if '€' in t else ''


def parse_offer(promo: Node) -> dict:
    """
    A promotion (wp-block-solis-promotion): the machine and its attachment,
    the saving, the pitch and its points, and the price table — each line
    with its list price and its promotion price, then the totals.
    """
    offer: dict = {}
    images = [img(i) for i in promo.find_all(lambda n: n.tag == 'img')]
    images = [i for i in images if i.get('src')]
    if images:
        offer['images'] = images
    stamp = promo.first(lambda n: 'actie-stamp' in n.cls)
    if stamp is not None:
        label = stamp.first(lambda n: n.tag == 'span')
        value = stamp.first(lambda n: n.tag == 'strong')
        offer['saving'] = {'label': label.text() if label else '', 'value': value.text() if value else ''}
    body = promo.first(lambda n: 'actie-body' in n.cls) or promo
    eyebrow = body.first(lambda n: 'eyebrow' in n.cls)
    if eyebrow is not None:
        offer['eyebrow'] = eyebrow.text()
    title = body.first(lambda n: n.tag in ('h2', 'h3'))
    if title is not None:
        offer['title'] = title.text()
    intro = body.first(lambda n: 'actie-intro' in n.cls)
    if intro is not None:
        offer['text'] = intro.text()
    points = [li.text() for li in body.find_all(lambda n: n.tag == 'li' and n.inside(lambda q: 'actie-punten' in q.cls))]
    if points:
        offer['points'] = points
    table = body.first(lambda n: n.tag == 'table')
    if table is not None:
        head = [th.text() for th in table.find_all(lambda n: n.tag == 'th' and n.inside(lambda q: q.tag == 'thead'))]
        rows = []
        for tr in table.find_all(lambda n: n.tag == 'tr' and not n.inside(lambda q: q.tag == 'thead')):
            th = tr.first(lambda n: n.tag == 'th')
            if th is None:
                continue
            small = th.first(lambda n: n.tag == 'small')
            name = th.text().replace(small.text(), '').strip() if small is not None else th.text()
            was = tr.first(lambda n: n.tag == 'td' and 'acties-was' in n.cls)
            now = tr.first(lambda n: n.tag == 'td' and 'acties-now' in n.cls)
            row = {'item': name, 'was': money(was.text()) if was else '', 'now': money(now.text()) if now else ''}
            if small is not None and small.text():
                row['note'] = small.text()
            if tr.inside(lambda q: q.tag == 'tfoot'):
                row['total'] = True
            rows.append(row)
        offer['table'] = {'head': head, 'rows': rows}
    period = body.first(lambda n: 'actie-period' in n.cls)
    if period is not None:
        strong = period.first(lambda n: n.tag == 'strong')
        span = period.first(lambda n: n.tag == 'span')
        offer['period'] = {'title': strong.text() if strong else '', 'text': span.text() if span else ''}
    actions = [link(a) for a in body.find_all(lambda n: n.tag == 'a' and n.attrs.get('href') and 'button' in n.cls)]
    if actions:
        offer['actions'] = actions
    footnote = body.first(lambda n: 'acties-footnote' in n.cls)
    if footnote is not None:
        offer['footnote'] = footnote.text()
    return offer


def parse_section(sec: Node) -> dict:
    cls = sec.cls
    promo = sec.first(lambda n: 'wp-block-solis-promotion' in n.cls)
    if promo is not None:
        tone = 'white' if 'white' in cls else 'paper'
        variant = sorted(c for c in cls if c not in ('content-section', 'white', 'wp-block-group'))
        return {'kind': 'section', 'tone': tone, 'variant': variant, 'offer': parse_offer(promo)}
    block: dict = {'kind': 'hero' if ('page-hero' in cls or 'information-hero' in cls) else 'section'}
    if sec.attrs.get('id'):
        block['id'] = sec.attrs['id']
    inner_ids = [n.attrs['id'] for n in sec.iter() if n.attrs.get('id') and n.tag in ('div', 'form')]
    if inner_ids and 'id' not in block:
        block['id'] = inner_ids[0]
    tone = 'paper'
    if 'white' in cls:
        tone = 'white'
    if cls & DARK or sec.first(lambda n: n.tag == 'p' and {'eyebrow', 'light'} <= n.cls):
        tone = 'dark'
    block['tone'] = tone
    block['variant'] = sorted(c for c in cls if c not in ('content-section', 'white', 'wp-block-group'))

    if block['kind'] == 'hero':
        style = sec.attrs.get('style', '')
        m = re.search(r'url\(([^)]+)\)', style)
        hero = m.group(1) if m else next((SITE + p for k, p in HERO_IMAGES.items() if k in cls), None)
        if hero:
            block['image'] = {'src': hero, 'alt': ''}
        status = sec.first(lambda n: 'dealer-stock' in n.cls)
        if status:
            block['badge'] = status.text()

    not_in_card = lambda n: not n.inside(CARD) and not CARD(n)
    eb = sec.first(lambda n: n.tag == 'p' and 'eyebrow' in n.cls and not_in_card(n))
    if eb:
        block['eyebrow'] = eb.text()
    h = sec.first(lambda n: n.tag in ('h1', 'h2') and not_in_card(n))
    if h:
        block['title'] = h.text()
    else:
        strong = sec.first(lambda n: n.tag == 'strong' and not_in_card(n) and not n.inside(lambda q: q.tag in ('p', 'a', 'li')))
        if strong is not None and not any(isinstance(c, Node) and c.tag == 'br' for c in (strong.parent.children if strong.parent else [])):
            block['title'] = strong.text()
    paras = []
    for p in sec.find_all(lambda n: n.tag == 'p' and 'eyebrow' not in n.cls and not_in_card(n)):
        if p.inside(lambda q: q.tag == 'form'):
            continue
        t = p.text(keep_breaks=True)
        if t:
            paras.append(t)
    if paras:
        block['text'] = paras
    lists = []
    for ul in sec.find_all(lambda n: n.tag in ('ul', 'ol') and not_in_card(n) and not n.inside(lambda q: q.tag in ('ul', 'ol'))):
        items = [li.text() for li in ul.children if isinstance(li, Node) and li.tag == 'li' and li.text()]
        if items:
            lists.append(items)
    if lists:
        block['lists'] = lists
    # legal pages: headings and paragraphs in order, inside a plain content flow
    subs = sec.find_all(lambda n: n.tag in ('h2', 'h3') and not_in_card(n))
    if 'wp-block-group' in cls or len(subs) > 3:
        flow = []
        for n in sec.iter():
            if not_in_card(n) and n.tag in ('h2', 'h3', 'p', 'li') and not n.inside(lambda q: q.tag == 'li'):
                t = n.text(keep_breaks=True)
                if t and 'eyebrow' not in n.cls:
                    flow.append({'tag': n.tag, 'text': t})
        block['flow'] = flow
        block.pop('text', None)
        block.pop('lists', None)
        block.pop('title', None)
    im = sec.first(lambda n: n.tag == 'img' and not n.inside(lambda q: q.tag in ('article', 'figure', 'a')) and not_in_card(n))
    if im and 'image' not in block:
        block['image'] = img(im)
    figure = sec.first(lambda n: n.tag == 'figure' and 'dealer-map-render' in n.cls)
    if figure:
        fi = figure.first(lambda n: n.tag == 'img')
        credit = figure.first(lambda n: n.tag == 'a')
        block['map'] = {**img(fi), 'credit': credit.text() if credit else '', 'creditHref': credit.attrs.get('href', '') if credit else ''}
    arts = sec.find_all(lambda n: n.tag == 'article' and not n.inside(lambda q: q.tag == 'article'))
    items = [parse_item(a) for a in arts]
    heads = sec.find_all(lambda n: n.tag == 'h3' and not_in_card(n) and not n.inside(lambda q: q.tag == 'form'))
    if heads and arts and 'flow' not in block:
        groups, used = [], set()
        for h in heads:
            g: dict = {'title': h.text()}
            sibs = [c for c in h.parent.children if isinstance(c, Node)]
            i = sibs.index(h)
            if i > 0 and sibs[i - 1].tag == 'p':
                g['kicker'] = sibs[i - 1].text()
                used.add(g['kicker'])
            texts = []
            for c in sibs[i + 1:]:
                if c.tag != 'p':
                    break
                texts.append(c.text(keep_breaks=True))
            if texts:
                g['text'] = texts
                used.update(texts)
            groups.append(g)
        for item, art in zip(items, arts):
            idx = max((k for k, h in enumerate(heads) if before(h, art)), default=-1)
            if idx >= 0:
                item['group'] = idx
        block['groups'] = groups
        block['text'] = [t for t in block.get('text', []) if t not in used]
        if not block['text']:
            block.pop('text')
    if items:
        block['items'] = items
        grid = next((n for n in sec.iter() if n.tag == 'div' and any(isinstance(c, Node) and c.tag == 'article' for c in n.children)), None)
        if grid is not None:
            block['layout'] = sorted(c for c in grid.cls if c not in ('shell',))
    cards = [parse_card(c) for c in sec.find_all(lambda n: n.cls & {'regional-contact-card', 'dealer-address', 'contact-sidebar'} or n.tag == 'address')]
    cards = [c for c in cards if c]
    if cards:
        block['cards'] = cards
    is_action = lambda n: bool({'button', 'text-link', 'angled-download'} & n.cls) or n.attrs.get('href', '').lower().endswith('.pdf')
    actions = [link(a) for a in sec.find_all(lambda n: n.tag == 'a' and n.attrs.get('href') and not_in_card(n) and is_action(n))]
    if not actions and block['kind'] == 'hero':
        # A hero's plain row of links ("Terug naar home · Bekijk onze modellen").
        actions = [
            {**link(a), 'style': 'primary' if i == 0 else 'secondary'}
            for i, a in enumerate(sec.find_all(lambda n: n.tag == 'a' and n.attrs.get('href') and n.inside(lambda q: 'subnav' in q.cls)))
        ]
    if actions:
        block['actions'] = actions
    form = sec.first(lambda n: n.tag == 'form')
    if form is not None:
        block['form'] = 'warranty' if form.first(lambda n: n.attrs.get('name') in ('serienummer', 'kenteken')) or 'garantie' in json.dumps(form.attrs) else 'contact'
        options = [o.text() for o in form.find_all(lambda n: n.tag == 'option') if o.text()]
        if options:
            block['formOptions'] = options
    # a callout: <strong>Title</strong><br>text, outside articles
    for s in sec.find_all(lambda n: n.tag == 'strong' and not_in_card(n)):
        host = s.parent
        if host is not None and host.tag in ('div', 'aside', 'p') and any(isinstance(c, Node) and c.tag == 'br' for c in host.children):
            body = host.text(keep_breaks=True).replace(s.text(), '', 1).strip()
            if body:
                block['note'] = {'title': s.text(), 'text': body}
                block['text'] = [t for t in block.get('text', []) if s.text() not in t]
            break
    return block


def parse_page(html: str) -> dict:
    b = Builder()
    b.feed(html)
    root = b.root
    title = root.first(lambda n: n.tag == 'title')
    desc = root.first(lambda n: n.tag == 'meta' and n.attrs.get('name') == 'description')
    main = root.first(lambda n: n.tag == 'main')
    ORDER.clear()
    ORDER.update({id(n): i for i, n in enumerate(root.iter())})
    sections = [s for s in main.iter() if s.tag == 'section' and not s.inside(lambda q: q.tag == 'section')]
    return {
        'title': title.text() if title else '',
        'description': desc.attrs.get('content', '') if desc else '',
        'blocks': [parse_section(s) for s in sections],
    }


def dealer_facts(page: dict) -> dict:
    """Address, phone, website and map of a dealer page, from its contact card."""
    facts: dict = {}
    for block in page['blocks']:
        for card in block.get('cards', []):
            for ln in card.get('lines', []):
                if re.search(r'\d{4}\s?[A-Z]{2}', ln) and 'address' not in facts:
                    facts['address'] = [x for x in ln.split('\n') if x]
            for l in card.get('links', []):
                if l['kind'] == 'tel' and 'phone' not in facts:
                    facts['phone'] = {'label': l['label'], 'href': l['href']}
                if l['kind'] == 'external' and 'maps' not in l['href'] and 'website' not in facts:
                    facts['website'] = {'label': l['label'].replace('https://', '').replace('http://', ''), 'href': l['href']}
                if 'google.com/maps' in l['href'] and 'route' not in facts:
                    facts['route'] = l['href']
        if 'map' in block and 'map' not in facts:
            facts['map'] = block['map']
        if block['kind'] == 'hero' and 'image' in block:
            facts['photo'] = block['image']['src']
    return facts


def main(out_path: str, only: list[str] | None = None) -> None:
    if only:
        # Refresh just these pages (paths on solistractor.nl) in the existing
        # file; every other page and every dealer stays exactly as it was.
        with open(out_path, encoding='utf-8') as f:
            data = json.load(f)
        for src in only:
            dst = PAGES[src]
            print('page', src, '->', dst, file=sys.stderr)
            data['pages'][dst] = {'source': f'{SITE}/{src}/', **parse_page(fetch(src))}
    else:
        data = {'source': SITE, 'pages': {}, 'dealers': {}}
        for src, dst in PAGES.items():
            print('page', src, '->', dst, file=sys.stderr)
            data['pages'][dst] = {'source': f'{SITE}/{src}/', **parse_page(fetch(src))}
        for slug in DEALERS:
            print('dealer', slug, file=sys.stderr)
            page = parse_page(fetch(f'dealers/{slug}'))
            data['dealers'][slug] = {'source': f'{SITE}/dealers/{slug}/', **page, 'facts': dealer_facts(page)}
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    print('wrote', out_path, file=sys.stderr)


if __name__ == '__main__':
    # python scripts/scrape-pages.py [out.json] [--only acties bedankt]
    args = sys.argv[1:]
    only = args[args.index('--only') + 1:] if '--only' in args else None
    paths = args[: args.index('--only')] if '--only' in args else args
    main(paths[0] if paths else 'src/data/pages.json', only)
