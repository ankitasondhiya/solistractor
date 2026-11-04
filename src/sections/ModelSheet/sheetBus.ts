/**
 * Opens the model sheet from anywhere — the gallery, the finder, the compare
 * table — without those sections knowing about it. A DOM event, like the
 * demo form's bus: the sections are siblings that share nothing else.
 *
 * `origin` is the image the reader clicked, if any: the sheet flies a copy of
 * it into its own picture, so the eye follows the tractor into the panel.
 */
export type SheetTab = 'overview' | 'specs' | 'configure'

const EVENT = 'solis:model-sheet'

interface Detail {
  slug: string
  tab: SheetTab
  origin: HTMLImageElement | null
}

export function openModelSheet(slug: string, tab: SheetTab = 'overview', origin: HTMLImageElement | null = null): void {
  window.dispatchEvent(new CustomEvent<Detail>(EVENT, { detail: { slug, tab, origin } }))
}

export function onModelSheet(handler: (slug: string, tab: SheetTab, origin: HTMLImageElement | null) => void): () => void {
  const listener = (e: Event) => {
    const { slug, tab, origin } = (e as CustomEvent<Detail>).detail
    handler(slug, tab, origin ?? null)
  }
  window.addEventListener(EVENT, listener)
  return () => window.removeEventListener(EVENT, listener)
}

/** The image inside an element (a card, a table row), for `origin`. */
export function imageIn(el: Element | null | undefined): HTMLImageElement | null {
  return el?.querySelector('img') ?? null
}
