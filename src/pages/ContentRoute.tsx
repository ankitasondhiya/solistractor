import { useEffect, useState } from 'react'
import './pages.css'

import { useLanguage } from '../i18n/LanguageContext'
import { loadPages, type ContentPage, type DealerPage, type PagesFile } from '../data/pages'
import { byDistance, dealers, dealerSlug } from '../data/dealers'
import { links } from '../data/links'
import { usePersonal } from '../personal/personal'
import { goToSection, HOME, type Route } from '../router'
import { requestDemo } from '../sections/DemoRequest/demoBus'
import { ArrowRight, ArrowUpRight, Phone, Pin } from '../components/Icons'
import { Blocks } from './Blocks'

/** The short name a page goes by in the breadcrumb trail. */
const SHORT: Record<string, { nl: string; en: string }> = {
  'over-ons': { nl: 'Over Solis', en: 'About Solis' },
  informatie: { nl: 'Informatie', en: 'Information' },
  klantenservice: { nl: 'Service', en: 'Service' },
  garantie: { nl: 'Garantie', en: 'Warranty' },
  'garantie/registreren': { nl: 'Garantieformulier', en: 'Warranty registration' },
  contact: { nl: 'Contact', en: 'Contact' },
  privacybeleid: { nl: 'Privacybeleid', en: 'Privacy policy' },
  cookiebeleid: { nl: 'Cookiebeleid', en: 'Cookie policy' },
}

function setMeta(title: string, description: string): void {
  document.title = title
  document.querySelector('meta[name="description"]')?.setAttribute('content', description)
}

/**
 * Every page that used to send readers to solistractor.nl, shown here: the
 * content loads on first use (its own chunk), the page gets its own title and
 * description, a breadcrumb trail back home, and — on a dealer's page — the
 * distance from the reader and a demo request with that dealer filled in.
 */
export default function ContentRoute({ route }: { route: Exclude<Route, { kind: 'landing' }> }) {
  const { t, lang } = useLanguage()
  const [data, setData] = useState<PagesFile | null>(null)

  useEffect(() => {
    loadPages().then(setData)
  }, [])

  const page: ContentPage | DealerPage | null =
    !data || route.kind === 'notfound'
      ? null
      : route.kind === 'page'
        ? data.pages[route.page]
        : data.dealers[route.slug] ?? null

  useEffect(() => {
    if (page) setMeta(page.title, page.description)
    else if (route.kind === 'notfound') setMeta(`${t.pages.notFoundTitle} | Solis`, t.pages.notFoundText)
  }, [page, route, t])

  if (route.kind === 'notfound') return <NotFound />
  if (!page) return <Loading />

  const crumbs = (
    <nav className="cp-crumbs" aria-label={t.pages.breadcrumb}>
      <ol>
        <li>
          <a href={HOME}>{t.pages.home}</a>
        </li>
        {route.kind === 'page' && route.page === 'garantie/registreren' && (
          <li>
            <a href={links.warranty}>{SHORT.garantie![lang]}</a>
          </li>
        )}
        {route.kind === 'dealer' && (
          <li>
            <a href={links.dealers}>{t.pages.dealers}</a>
          </li>
        )}
        <li aria-current="page">
          {route.kind === 'page' ? SHORT[route.page]![lang] : dealers.find((d) => dealerSlug(d) === route.slug)?.name}
        </li>
      </ol>
    </nav>
  )

  const [hero, ...rest] = page.blocks
  // On a dealer's page "Plan een bezoek" asks for a demo with that dealer filled in.
  const handlers: Record<string, () => void> =
    route.kind === 'dealer'
      ? {
          '/contact': () => {
            requestDemo(null, undefined, route.slug)
            goToSection('demo')
          },
        }
      : {}
  const note = lang === 'en' && t.pages.dutchOnly ? <p className="cp-lang-note container">{t.pages.dutchOnly}</p> : null

  return (
    <div className="cpage" data-route={route.kind}>
      {hero && <Blocks blocks={[hero]} crumbs={crumbs} handlers={handlers} />}
      {note}
      {route.kind === 'dealer' && <DealerBar slug={route.slug} page={page as DealerPage} />}
      <Blocks blocks={rest} handlers={handlers} />
    </div>
  )
}

/** A dealer page's quick facts: how far, call, route, website, plan a demo. */
function DealerBar({ slug, page }: { slug: string; page: DealerPage }) {
  const { t } = useLanguage()
  const { place } = usePersonal()
  const dealer = dealers.find((d) => dealerSlug(d) === slug)
  const km = place && dealer ? byDistance(place, [dealer])[0]?.km : undefined
  const f = page.facts
  return (
    <section className="cp-dealerbar" aria-label={dealer?.name}>
      <div className="container">
        <div className="cp-dealerbar__inner">
        <div className="cp-dealerbar__where">
          <Pin aria-hidden="true" />
          <span>
            {f.address?.slice(0, 2).join(', ')}
            {km !== undefined && place && <strong>{t.pages.distance(km, place.label)}</strong>}
          </span>
        </div>
        <div className="cp-dealerbar__actions">
          {f.phone && (
            <a className="btn btn--ghost btn--sm" href={f.phone.href}>
              <Phone className="btn__icon" />
              {f.phone.label}
            </a>
          )}
          {f.route && (
            <a className="btn btn--ghost btn--sm" href={f.route} target="_blank" rel="noopener noreferrer">
              <Pin className="btn__icon" />
              Route
              <span className="visually-hidden"> {t.pages.external}</span>
            </a>
          )}
          {f.website && (
            <a className="btn btn--ghost btn--sm" href={f.website.href} target="_blank" rel="noopener noreferrer">
              {f.website.label}
              <ArrowUpRight className="btn__icon" />
              <span className="visually-hidden"> {t.pages.external}</span>
            </a>
          )}
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => {
              requestDemo(null, undefined, slug)
              goToSection('demo')
            }}
          >
            {t.pages.planDemo}
            <ArrowRight className="btn__icon" />
          </button>
        </div>
        </div>
      </div>
    </section>
  )
}

function Loading() {
  const { t } = useLanguage()
  return (
    <div className="cpage">
      <section className="cp-hero" data-dark-hero="" data-photo="false" aria-busy="true">
        <div className="container cp-hero__inner">
          <p className="cp-hero__lead">{t.pages.loading}</p>
        </div>
      </section>
    </div>
  )
}

function NotFound() {
  const { t } = useLanguage()
  const places = [
    { href: HOME, label: t.pages.backHome },
    { href: links.models, label: t.nav.models },
    { href: links.dealers, label: t.nav.dealers },
    { href: links.contact, label: 'Contact' },
  ]
  return (
    <div className="cpage">
      <section className="cp-hero" data-dark-hero="" data-photo="false">
        <div className="container cp-hero__inner">
          <p className="eyebrow eyebrow--light">404</p>
          <h1 className="display cp-hero__title" tabIndex={-1} data-page-title="">
            {t.pages.notFoundTitle}
          </h1>
          <p className="cp-hero__lead">{t.pages.notFoundText}</p>
          <div className="cp-actions">
            {places.map((p, i) => (
              <a key={p.href} className={i === 0 ? 'btn' : 'btn btn--ghost-light'} href={p.href}>
                {p.label}
                <ArrowRight className="btn__icon" />
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
