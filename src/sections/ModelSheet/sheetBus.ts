/**
 * Opens the model sheet from anywhere — the gallery, the finder, the compare
 * table — without those sections knowing about it. A DOM event, like the
 * demo form's bus: the sections are siblings that share nothing else.
 */
export type SheetTab = 'overview' | 'specs' | 'configure'

const EVENT = 'solis:model-sheet'

interface Detail {
  slug: string
  tab: SheetTab
}

export function openModelSheet(slug: string, tab: SheetTab = 'overview'): void {
  window.dispatchEvent(new CustomEvent<Detail>(EVENT, { detail: { slug, tab } }))
}

export function onModelSheet(handler: (slug: string, tab: SheetTab) => void): () => void {
  const listener = (e: Event) => {
    const { slug, tab } = (e as CustomEvent<Detail>).detail
    handler(slug, tab)
  }
  window.addEventListener(EVENT, listener)
  return () => window.removeEventListener(EVENT, listener)
}
