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
| 03 | Model gallery | All 12 models on a turning 3D ring (CSS 3D — every card stays a real button): scrolling turns it on desktop, swiping on phones; drag, arrows, keys and the segment chips (with their power range) turn it too, and the front card opens its sheet. | Ascenta Studio |
| 03 | Compare table | All 12 models side by side — power, engine, lift, transmission, PTO, width, price — filterable by segment. | — |
| 03 | Model sheet | Opens from the gallery, table and finder: overview, full specs and downloads, and the model's **configurator** with the official option prices and rules (live total, "take to a quote" fills the demo form). | solistractor.nl/modellen |
| 03 | Model finder | "Welke past bij mijn werk?" answered on the page: two questions, three ranked models. | — |
| 04 | Engineering | Hotspots on the finished tractor. | — |
| 05 | Journey | One pinned photo; the Solis story, then Kies / Probeer / Rijd. | Enki's Web Studio |
| 05 | Dealers | The 20 dealers, filterable by province — and sorted nearest first once the visitor shares their location or types a postcode / town (distance in km on every card). | — |
| 05 | Demo request | Three-step form, pre-filled with the visitor's last-viewed model, town and nearest dealer; opens their email app with the request to info@solistractor.nl (no backend). | Enki's Web Studio |
| — | Shortlist & compare | A ♥ on every model (gallery, compare table, finder, sheet) saves up to 3; a tray at the foot (desktop) or the phone action bar opens them side by side with the best figure in each row marked, and asks for a demo of all of them at once. | — |
| — | Phone action bar | Bel · Dealer (with the distance to your nearest) · Shortlist · Demo within thumb reach; steps aside over the film, the demo form and the footer. | — |
| — | Welcome back (returning visitors) | A note under the header: "Continue with the S26?" and their nearest dealer. | — |
| — | Pause motion | Turns off smooth scrolling and ambient loops. `prefers-reduced-motion` gets static sections. | Ascenta Studio |
| — | Companion (studio) | A small Solis drives along a track at the foot of the screen as you scroll. | Ascenta Studio (hummingbird) |

## Where things live

```
src/
  edition.ts  which edition this page is (from the path)
  data/       filmTimeline.ts · studioTimeline.ts · timeline.ts (shared clock) · models.ts · dealers.ts · links.ts
  i18n/       copy.ts (every sentence, NL + EN) · LanguageContext.tsx
  motion/     MotionContext.tsx (Lenis + GSAP clock, pause) · MotionLayer.tsx (Motion for React) · preload.ts
  personal/   personal.ts (what this browser remembers) · locate.ts (geolocation + PDOK postcode search)
  hooks/      progressStore · useScrollProgress · useFrameSequence · usePinnedProgress …
  sections/   one folder per section, each with its own CSS (FilmHero, StudioHero, HeroStatic …)
  components/ header, footer, preloader, icons, Chip (sliding filter chips), WelcomeBack, ScrollTractor (studio)
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

[Motion for React](https://motion.dev) (`motion`, pinned) handles the component moves that GSAP and CSS
don't do well — dealer cards gliding to their new order when the list re-sorts
by distance (FLIP layout), the highlight travelling between filter chips
(shared layout) and the welcome note's exit. Opening a model flies its photo
from the card you clicked into the sheet and back on close (`motion/flight.ts`),
and the gallery's figures — power, lift, width, price — roll to the next model's
values (`components/RollingNumber.tsx`). Its features load lazily as their
own chunk, and it follows *Pause motion* and `prefers-reduced-motion`. GSAP +
Lenis keep the scroll-scrubbed film.

Built against the rules in [ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill):
shared duration/easing tokens in `global.css` (exits faster than entrances, decelerate in,
accelerate out, a spring on press release), press feedback on every control, headline
lines that rise out of a mask as sections enter, a pausable marquee that also stops
offscreen / on hover / in hidden tabs, a skippable preloader, a magnetic primary CTA
(fine pointers only), a short fade between editions, focus rings at 3:1+ on every
ground, AA contrast for small green text, and reduced-motion support throughout.

Audited with axe-core (WCAG 2.2 AA) against the skill's checklist: every
control has a 44 px target (small ones extend an invisible hit area past their
edge), no text under 12 px, focused controls scroll clear of the fixed header,
unique landmark names, declared image sizes (no layout shift), segment filters
that state their power range, and a demo form that validates on blur and marks
required fields for screen readers.

## Personalisation — on this device only

The page remembers a few things the visitor did, so a second visit picks up
where the first left off (`src/personal/personal.ts`, one `localStorage` key):

- **Where they are** — set by *Use my location* (the browser asks permission;
  stored rounded to ~1 km) or by a postcode / town. Sorts the dealers nearest
  first and pre-selects the nearest dealer in the demo form.
- **Models they opened** — the welcome-back note offers the last one, and the
  demo form pre-selects it.
- **Their model-finder answers** — the finder opens with them, and those models
  carry a *Uw match* badge in the gallery and the compare table.

Nothing is sent anywhere and there is no tracking. *Forget my choices* in the
footer wipes everything the site stores. Untouched form fields follow the
latest choice; anything the visitor typed is never overwritten.

**Nearest dealer.** Postcodes and towns are looked up with
[PDOK Locatieserver](https://api.pdok.nl/bzk/locatieserver/search/v3_1/) (the
Dutch government's free address service — no key, CORS open); the reverse
lookup names the town for *Use my location*. Each dealer carries its town's
coordinates (`src/data/dealers.ts`, geocoded once with PDOK); distances are
straight-line km. There is deliberately no IP lookup: in the Netherlands it
mostly resolves to the provider's hub, and it would send every visitor's IP to
a third party without consent.

**Shareable models.** Every model sheet has its own address — `/#model-s26` —
that opens the sheet after the preloader; the browser's Back button closes it.

## Content and images

- Model data, prices, dealer list and copy are taken from solistractor.nl as published.
- The 12 model cut-outs (and, in the studio edition, the farmyard and detail photos) are **hot-linked** from solistractor.nl's WordPress uploads
  (`src/data/links.ts → MEDIA`). Copy them into `public/media/` and point `MEDIA`
  there before shipping.
- The film shows a red S75; the Dutch range on solistractor.nl is blue.
- Every deeper link (model pages, dealers, forms) goes to the existing site.
