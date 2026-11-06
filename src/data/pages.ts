/**
 * The deeper pages of solistractor.nl — about, information, service,
 * warranty, warranty registration, contact, privacy, cookies, promotions,
 * the thank-you page and the twenty dealer pages — as structured content (src/data/pages.json, rebuilt by
 * scripts/scrape-pages.py, media localised by scripts/localize-media.py).
 *
 * Every page is a list of blocks in the site's own theme shape: a hero, then
 * sections of eyebrow + heading + text with an image, a grid of cards,
 * contact cards, a map, a form or a legal text. src/pages/ draws them in this
 * site's design. Loaded on first use, as its own chunk.
 */
import type { PageId } from '../router'

export interface PageImage {
  src: string
  alt: string
}

export interface PageLink {
  label: string
  href: string
  kind: 'internal' | 'anchor' | 'tel' | 'mail' | 'external' | 'file'
  style?: 'primary' | 'secondary' | 'text'
}

export interface PageItem {
  /** "01", "1955", "Jaar 1", "50 pk", "Basis" */
  marker?: string
  kicker?: string
  title?: string
  text?: string[]
  /** the small line under a figure: "150+" / "landen volgens Solis" */
  label?: string
  image?: PageImage
  rows?: { term: string; value: string }[]
  note?: string[]
  links?: PageLink[]
  featured?: boolean
  /** index into the block's groups */
  group?: number
}

export interface PageCard {
  eyebrow?: string
  title?: string
  lines?: string[]
  links?: PageLink[]
}

export interface PageBlock {
  kind: 'hero' | 'section'
  id?: string
  tone: 'paper' | 'white' | 'dark'
  variant: string[]
  image?: PageImage
  badge?: string
  eyebrow?: string
  title?: string
  text?: string[]
  lists?: string[][]
  flow?: { tag: 'h2' | 'h3' | 'p' | 'li'; text: string }[]
  map?: PageImage & { credit: string; creditHref: string }
  items?: PageItem[]
  layout?: string[]
  groups?: { title: string; kicker?: string; text?: string[] }[]
  cards?: PageCard[]
  actions?: PageLink[]
  form?: 'contact' | 'warranty'
  formOptions?: string[]
  note?: { title: string; text: string }
  /** a promotion (solistractor.nl/acties): machine plus attachment at the promotion price */
  offer?: PageOffer
}

/** One line of a promotion's price table: the list price, struck through, and the promotion price. */
export interface PageOfferRow {
  item: string
  note?: string
  /** "€ 24.275", or "" where there was no list price ("n.v.t.") */
  was: string
  now: string
  /** the totals row */
  total?: boolean
}

export interface PageOffer {
  /** the machine first, then its attachment */
  images?: PageImage[]
  /** "Uw voordeel" · "€ 3.750" */
  saving?: { label: string; value: string }
  eyebrow?: string
  title?: string
  text?: string
  points?: string[]
  table?: { head: string[]; rows: PageOfferRow[] }
  /** how long the promotion runs, as the price list puts it */
  period?: { title: string; text: string }
  actions?: PageLink[]
  footnote?: string
}

export interface ContentPage {
  source: string
  title: string
  description: string
  blocks: PageBlock[]
}

export interface DealerFacts {
  photo?: string
  address?: string[]
  phone?: { label: string; href: string }
  website?: { label: string; href: string }
  route?: string
  map?: PageImage & { credit: string; creditHref: string }
}

export interface DealerPage extends ContentPage {
  facts: DealerFacts
}

export interface PagesFile {
  source: string
  pages: Record<PageId, ContentPage>
  dealers: Record<string, DealerPage>
}

let promise: Promise<PagesFile> | null = null

/** The pages' content, fetched once (a separate chunk; the landing page never needs it). */
export function loadPages(): Promise<PagesFile> {
  promise ??= import('./pages.json').then((m) => m.default as unknown as PagesFile)
  return promise
}
