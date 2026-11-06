import { useSyncExternalStore } from 'react'

import { EDITION, editionPath } from './edition'
import { followLegacy, legacyTarget } from './legacy'

/**
 * A small router for the pages that used to live on solistractor.nl — the
 * Solis story, information, service, warranty, contact, the legal pages and
 * every dealer — so a reader never has to leave this site.
 *
 * Real addresses (/over-ons, /dealers/goedhart) through the History API: the
 * back button, new tabs and shared links all work. Any same-site <a href> is
 * picked up by one document-level listener, so links stay plain links.
 * "/#dealers" style links mean "a section of the landing page": from another
 * page they go home first, then scroll there (or open a model's sheet for
 * "/#model-s26"). The landing page keeps its own edition (/ or /studio).
 */

export type PageId =
  | 'over-ons'
  | 'informatie'
  | 'klantenservice'
  | 'garantie'
  | 'garantie/registreren'
  | 'contact'
  | 'privacybeleid'
  | 'cookiebeleid'
  | 'acties'
  | 'bedankt'

export const PAGE_IDS: PageId[] = [
  'over-ons',
  'informatie',
  'klantenservice',
  'garantie',
  'garantie/registreren',
  'contact',
  'privacybeleid',
  'cookiebeleid',
  'acties',
  'bedankt',
]

export type Route =
  | { kind: 'landing' }
  | { kind: 'page'; page: PageId }
  | { kind: 'dealer'; slug: string }
  /** /geschiedenis: the history of ITL and Solis, a page of its own design (src/pages/HistoryPage.tsx) */
  | { kind: 'history' }
  | { kind: 'notfound' }

/** The history page's address. */
export const HISTORY_PATH = '/geschiedenis'

const NAVIGATE = 'solis:navigate'
const ARRIVE = 'solis:arrive'

function normalise(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/'
}

export function matchRoute(pathname: string, dealerSlugs: readonly string[]): Route {
  const path = normalise(pathname)
  if (path === '/' || path === '/studio') return { kind: 'landing' }
  if (path === HISTORY_PATH) return { kind: 'history' }
  const id = path.slice(1)
  if ((PAGE_IDS as string[]).includes(id)) return { kind: 'page', page: id as PageId }
  const dealer = /^dealers\/([a-z0-9-]+)$/.exec(id)
  if (dealer && dealerSlugs.includes(dealer[1]!)) return { kind: 'dealer', slug: dealer[1]! }
  return { kind: 'notfound' }
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('popstate', callback)
  window.addEventListener(NAVIGATE, callback)
  return () => {
    window.removeEventListener('popstate', callback)
    window.removeEventListener(NAVIGATE, callback)
  }
}

const currentPath = () => normalise(window.location.pathname)

export function usePath(): string {
  return useSyncExternalStore(subscribe, currentPath)
}

/** The landing page of the edition this visit started in. */
export const HOME = editionPath[EDITION]

export interface Arrival {
  /** "#dealers", "#model-s26" or "" */
  hash: string
  /** the path did not change (a section link on the same page) */
  samePath: boolean
  /** back / forward rather than a click */
  fromHistory: boolean
}

/** Runs `handler` after every navigation, once the new page is on screen. */
export function onArrive(handler: (arrival: Arrival) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<Arrival>).detail)
  window.addEventListener(ARRIVE, listener)
  return () => window.removeEventListener(ARRIVE, listener)
}

function arrive(detail: Arrival): void {
  // After React has rendered the new route.
  requestAnimationFrame(() => requestAnimationFrame(() => window.dispatchEvent(new CustomEvent(ARRIVE, { detail }))))
}

/**
 * Goes to a path on this site. "/" means the landing page of this visit's
 * edition, so a link home from /studio stays in the studio edition.
 */
export function navigate(href: string, { replace = false }: { replace?: boolean } = {}): void {
  let url = new URL(href, window.location.origin)
  // An old solistractor.nl address in a link: its place here (legacy.ts).
  const legacy = legacyTarget(url.pathname, url.search)
  if (legacy) {
    followLegacy(legacy)
    url = new URL(legacy.href, window.location.origin)
  }
  let pathname = normalise(url.pathname)
  if (pathname === '/' || pathname === '/studio') pathname = HOME
  const samePath = pathname === currentPath() && url.search === window.location.search
  if (!samePath) {
    // Remember where the landing page was, so coming back restores it.
    if (matchRoute(currentPath(), []).kind === 'landing') landingScroll = window.scrollY
    window.history[replace ? 'replaceState' : 'pushState']({ solisRoute: true }, '', pathname + url.search)
    lastPath = pathname
    window.dispatchEvent(new Event(NAVIGATE))
  }
  arrive({ hash: url.hash, samePath, fromHistory: false })
}

/** Goes to a section of the landing page ("dealers", "demo") from anywhere. */
export function goToSection(id: string): void {
  navigate(`/#${id}`)
}

/** The landing page's scroll position when the reader left it for another page. */
let landingScroll = 0
export function landingScrollY(): number {
  return landingScroll
}

/** The path the router last showed — a model sheet's #hash entries don't change it. */
let lastPath = currentPath()

window.addEventListener('popstate', () => {
  const path = currentPath()
  if (path === lastPath) return // a sheet's own history entry, not a page change
  if (matchRoute(lastPath, []).kind === 'landing') landingScroll = window.scrollY
  lastPath = path
  arrive({ hash: '', samePath: false, fromHistory: true })
})

/** Whether a link should be handled here rather than by the browser. */
function isOwnLink(a: HTMLAnchorElement, e: MouseEvent): boolean {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false
  if (a.target && a.target !== '_self') return false
  if (a.hasAttribute('download')) return false
  const href = a.getAttribute('href') ?? ''
  if (!href.startsWith('/') || href.startsWith('//')) return false
  // Files (PDFs, images) open as files.
  if (/^\/media\//.test(href) || /\.[a-z0-9]{2,4}(\?|#|$)/i.test(href)) return false
  return true
}

document.addEventListener('click', (e) => {
  const a = (e.target as Element | null)?.closest?.('a')
  if (!(a instanceof HTMLAnchorElement) || !isOwnLink(a, e)) return
  e.preventDefault()
  navigate(a.getAttribute('href')!)
})
