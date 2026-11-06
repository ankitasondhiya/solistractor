import { requestDemo } from './sections/DemoRequest/demoBus'

/**
 * Every address solistractor.nl publishes, opened on this site. Most of its
 * pages have a page of the same name here (/over-ons, /acties, /dealers/…);
 * the rest are shown on the landing page or under another name, and an old
 * link, bookmark or search result for them lands on the same thing here:
 *
 *   /modellen               the model range          -> /#modellen
 *   /modellen/s50           one model's page         -> /#model-s50 (its sheet)
 *   /keuzehulp              the model finder         -> /#keuzehulp
 *   /vergelijken            the comparison table     -> /#vergelijken
 *   /dealers                the dealer list          -> /#dealers
 *   /demonstratie?model=s50 the demo request         -> /#demo, S50 chosen
 *   /garantieformulier      warranty registration    -> /garantie/registreren
 *   /actie/actie-s50        a single promotion       -> /acties
 *
 * Runs once, before the app renders (main.tsx imports it first), so the
 * router, the model sheet and the landing page all read the new address.
 * In-site links to an old address go through `legacyTarget` in the router.
 */
export interface LegacyTarget {
  /** the address here: a path, a landing-page section or a model's sheet */
  href: string
  /** "/demonstratie?model=s50": the tractor to choose in the demo form */
  demoModel?: string
}

const SECTIONS: Record<string, string> = {
  modellen: '/#modellen',
  keuzehulp: '/#keuzehulp',
  vergelijken: '/#vergelijken',
  dealers: '/#dealers',
}

export function legacyTarget(pathname: string, search = ''): LegacyTarget | null {
  const path = pathname.replace(/^\/+|\/+$/g, '')
  if (path === 'home') return { href: '/' }
  const section = SECTIONS[path]
  if (section) return { href: section }
  const model = /^modellen\/([a-z0-9-]+)$/.exec(path)
  if (model) return { href: `/#model-${model[1]}` }
  if (path === 'demonstratie' || path === 'demo') {
    const chosen = new URLSearchParams(search).get('model')
    return chosen && /^[a-z0-9-]+$/.test(chosen) ? { href: '/#demo', demoModel: chosen } : { href: '/#demo' }
  }
  if (path === 'garantieformulier') return { href: '/garantie/registreren' }
  if (/^actie\/[a-z0-9-]+$/.test(path)) return { href: '/acties' }
  return null
}

/** Hands an old address's demo model to the form, which picks it up when it mounts (or at once). */
export function followLegacy(target: LegacyTarget): void {
  if (target.demoModel) requestDemo(target.demoModel)
}

const loaded = legacyTarget(window.location.pathname, window.location.search)
if (loaded) {
  followLegacy(loaded)
  window.history.replaceState(window.history.state, '', loaded.href)
}
