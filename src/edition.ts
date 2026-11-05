/**
 * Two editions of the same landing page.
 *
 *   film    A red S75 built and put to work in a full-screen cinematic film;
 *           white type over the picture.
 *   studio  The first version: a blue Solis assembling in front of giant
 *           chapter words on a cream studio, cut out of its background (after
 *           the "Pour / Play" reference).
 *
 * For now only the studio edition is shown, at `/`: the film edition's code
 * and frames stay in the project, but nothing links to it and no path opens
 * it. Set FILM_EDITION_LIVE to true to bring it back — the film at `/`, the
 * studio at `/studio`, and the Film | Studio switches in header and footer.
 *
 * Everything below the hero is shared; where a section shows the machine it
 * takes its still from the edition's own film (see each section's EDITION
 * table). The edition is fixed for the life of the page — switching is a
 * navigation, so nothing has to swap assets mid-scroll.
 */
export type Edition = 'film' | 'studio'

/** Whether the film edition is offered at all (see above). */
export const FILM_EDITION_LIVE = false

/** The editions a reader can reach; a switch between them shows only when there are two. */
export const EDITIONS: Edition[] = FILM_EDITION_LIVE ? ['film', 'studio'] : ['studio']

export const editionPath: Record<Edition, string> = FILM_EDITION_LIVE
  ? { film: '/', studio: '/studio' }
  : { film: '/', studio: '/' }

const STUDIO_PATH = /^\/studio\/?$/

export const EDITION: Edition =
  FILM_EDITION_LIVE && !STUDIO_PATH.test(window.location.pathname) ? 'film' : 'studio'

// An old /studio link while the studio is the only edition: same page, shown at `/`.
if (!FILM_EDITION_LIVE && STUDIO_PATH.test(window.location.pathname)) {
  window.history.replaceState(window.history.state, '', `/${window.location.search}${window.location.hash}`)
}

/** How long the page takes to fade before it leaves (global.css, --dur-2). */
const LEAVE_MS = 240

type ClickLike = Pick<MouseEvent, 'preventDefault' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'button'>

/**
 * Click handler for links to the other edition: the page fades for one short
 * beat, then navigates — a cue that the whole page is changing, never a wait.
 * New-tab clicks, and readers who asked for reduced motion, go at once.
 */
export function leaveForEdition(event: ClickLike, href: string): void {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  event.preventDefault()
  document.documentElement.dataset.leaving = 'true'
  window.setTimeout(() => window.location.assign(href), LEAVE_MS)
}

// Back/forward can restore this page from the browser's cache mid-fade.
window.addEventListener('pageshow', () => {
  delete document.documentElement.dataset.leaving
})
