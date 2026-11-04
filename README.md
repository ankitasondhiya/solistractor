# Solis Tractoren — landing page redesign

A concept redesign of the home page of [solistractor.nl](https://www.solistractor.nl/),
built in React + TypeScript + Vite. Dutch by default, English one click away.

```bash
npm install
npm run dev        # http://localhost:5174 and http://localhost:5174/studio
npm run build      # typecheck + production build into dist/ (dist/studio/ included)
```

## Two editions

The page exists in two versions, both live, with a **Versie / Version** switch in
the footer. Everything below the hero is shared; each edition uses stills from its
own film where a section shows the machine (`src/edition.ts`).

| Edition | Path | Hero |
|---------|------|------|
| **Film** | `/` | A red S75 in a full-screen cinematic film: axle and body assembling in a dark studio, driver aboard, lights on, a tyre in macro, sunrise in the field. White type low-left, chapter rail, hairline progress. |
| **Studio** | `/studio` | The first version: a blue Solis assembling on a cream studio, cut out of its background so it stands in front of a giant navy word per chapter (after the "Pour / Play" reel), with corner labels, floating fact cards, callouts, dots, a turning badge, and the small tractor that drives along the foot of the page. |

## The page, top to bottom

| # | Section | What it does | Reference |
|---|---------|--------------|-----------|
| — | Preloader | Counter tied to the real loading of the hero's first 30 frames; the headline fills letter by letter. | Enki's Web Studio |
| 01 | Hero (per edition) | The tractor, built as you scroll — see **Two editions** above. | Hitachi hero (scroll machinery), Ascenta (film in the page), "Pour / Play" reel (studio composition) |
| — | Marquee | Headline facts; speeds up with scroll and turns round when you scroll back. | Enki's Web Studio |
| 02 | Statement | The brand sentence, assembled from scattered words as you scroll, then four counters. | Enki's Web Studio |
| 02 | Why Solis | Four stacked sticky cards. | Enki's Web Studio |
| 03 | Model gallery | All 12 models on a pinned, curved 3D rail with segment chips and a live spec panel (swipe carousel on phones). | Ascenta Studio |
| 03 | Compare table | All 12 models side by side — power, engine, lift, transmission, PTO, width, price — filterable by segment. | — |
| 03 | Model sheet | Opens from the gallery, table and finder: overview, full specs and downloads, and the model's **configurator** with the official option prices and rules (live total, "take to a quote" fills the demo form). | solistractor.nl/modellen |
| 03 | Model finder | "Welke past bij mijn werk?" answered on the page: two questions, three ranked models. | — |
| 04 | Engineering | Hotspots on the finished tractor. | — |
| 05 | Journey | One pinned photo; the Solis story, then Kies / Probeer / Rijd. | Enki's Web Studio |
| 05 | Dealers | The 20 dealers, filterable by province. | — |
| 05 | Demo request | Three-step form; opens the visitor's email app with the request to info@solistractor.nl (no backend). | Enki's Web Studio |
| — | Pause motion | Turns off smooth scrolling and ambient loops. `prefers-reduced-motion` gets static sections. | Ascenta Studio |
| — | Companion (studio) | A small Solis drives along a track at the foot of the screen as you scroll. | Ascenta Studio (hummingbird) |

## Where things live

```
src/
  edition.ts  which edition this page is (from the path)
  data/       filmTimeline.ts · studioTimeline.ts · timeline.ts (shared clock) · models.ts · dealers.ts · links.ts
  i18n/       copy.ts (every sentence, NL + EN) · LanguageContext.tsx
  motion/     MotionContext.tsx (Lenis + GSAP clock, pause) · preload.ts
  hooks/      progressStore · useScrollProgress · useFrameSequence · usePinnedProgress …
  sections/   one folder per section, each with its own CSS (FilmHero, StudioHero, HeroStatic …)
  components/ header, footer, preloader, icons, ScrollTractor (studio)
public/
  frames/film/lg|md/…120.webp       film edition, 1920 px and 1280 px
  frames/studio/lg|sm/…160.webp     studio edition, cut-outs, 1280 px and 720 px
  media/film|studio/                stills taken from each edition's film
scripts/
  extract-frames.mjs                rebuilds public/frames/film from a new film
  cutout-frames.py                  keys the studio out of the studio edition's frames
  spa-routes.mjs                    copies the app shell to dist/studio/ after a build
```

## The film edition

`public/frames/film` is the supplied 10 s, 1920×1080 clip
(`Tractor_assembling_and_driving_…_8c9954e4_1080p.mp4`) resampled to 120 frames at
12 fps with the generator's watermark removed:

- `frames/film/lg` — 1920 px, the source's full resolution (7.3 MB), used by default
- `frames/film/md` — 1280 px (4.4 MB), used when the browser reports Save-Data or a 2G/3G link

The canvas is backed at the screen's own pixel density (up to a 4K width) and draws
each frame "cover" with high-quality smoothing, so a 4K screen shows every pixel of
the 1080p film with no second browser rescale. **True 4K detail needs a 4K source**:
re-export the film at 3840×2160 and run

```bash
node scripts/extract-frames.mjs path/to/film-4k.mp4 --fps 12 --delogo 3388:1708:188:188
```

which writes 3840 px frames to `frames/film/lg` with no code change (keep the frame
count at 120, or update `FRAME_COUNT` and the chapter timing in `src/data/filmTimeline.ts`).

Chapter timing and the frame curve are in `src/data/filmTimeline.ts`, on the shared
0..1 scroll clock. `public/media/film` holds three stills from the same film (studio,
tyre, field) used by the pillars, the engineering hotspots and the journey section.

## The studio edition

`public/frames/studio` is the first supplied clip (`gemini_generated_video_6e54d97a.mp4`,
1280×720) resampled to 160 frames at 16 fps, watermark removed, and the grey studio
keyed out to transparency with the soft floor shadow kept (`scripts/cutout-frames.py`),
so the machine can stand in front of each chapter's word. Desktop gets 1280 px
frames, phones 720 px. Timing, camera and callout anchors are in
`src/data/studioTimeline.ts`; `public/media/studio` holds two cut-out stills.

## Model catalogue

`src/data/catalogue.json` is the complete model data from
[solistractor.nl/modellen](https://www.solistractor.nl/modellen/), as published: for
each of the 12 models the hero, key facts, intro and highlights, uses, the spec table,
downloads, and the configurator definition the site itself runs on — every version,
tyre, loader, hydraulic and accessory option with its price and rules (price list
01-02-2026, excl. VAT). Rebuild it with:

```bash
python scripts/scrape-catalogue.py src/data/catalogue.json
```

`src/data/catalogue.ts` types it and runs the configurators: `when` (availability),
`priceRule` / `labelRule` (if → then → else), auto-added items (mounting kits) and items
priced on request. Each model's default configuration equals its published starting
price. The catalogue loads as its own chunk the first time a sheet opens.

## Motion and UI system

Built against the rules in [ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill):
shared duration/easing tokens in `global.css` (exits faster than entrances, decelerate in,
accelerate out, a spring on press release), press feedback on every control, headline
lines that rise out of a mask as sections enter, a pausable marquee that also stops
offscreen / on hover / in hidden tabs, a skippable preloader, a magnetic primary CTA
(fine pointers only), a short fade between editions, focus rings at 3:1+ on every
ground, AA contrast for small green text, and reduced-motion support throughout.

## Content and images

- Model data, prices, dealer list and copy are taken from solistractor.nl as published.
- The 12 model cut-outs (and, in the studio edition, the farmyard and detail photos) are **hot-linked** from solistractor.nl's WordPress uploads
  (`src/data/links.ts → MEDIA`). Copy them into `public/media/` and point `MEDIA`
  there before shipping.
- The film shows a red S75; the Dutch range on solistractor.nl is blue.
- Every deeper link (model pages, dealers, forms) goes to the existing site.
