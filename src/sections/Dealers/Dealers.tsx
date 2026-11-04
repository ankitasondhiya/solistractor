import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { m } from 'motion/react'
import './dealers.css'

import { useLanguage } from '../../i18n/LanguageContext'
import { byDistance, dealers, provinces, type Province } from '../../data/dealers'
import { links } from '../../data/links'
import { ArrowUpRight, Check, Locate, Pin, Search } from '../../components/Icons'
import { Reveal } from '../../components/Reveal'
import { SlideChip } from '../../components/Chip'
import { setPlace, usePersonal } from '../../personal/personal'
import { LocateFailure, locateMe, searchPlace } from '../../personal/locate'

type Busy = 'gps' | 'search' | null

/**
 * Section 07 — the twenty dealers. The reader can say where they are (their
 * browser's location, or a postcode / town) and the list re-sorts nearest
 * first, each card gliding to its new place; the province filter still
 * narrows it. The place is remembered on this device for the next visit and
 * for the demo form.
 */
export function Dealers() {
  const { t } = useLanguage()
  const L = t.dealers.locate
  const { place } = usePersonal()
  const [province, setProvince] = useState<Province | null>(null)
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState<Busy>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const inputId = useId()
  const errorId = useId()
  const hintId = useId()

  useEffect(() => () => abortRef.current?.abort(), [])

  const filtered = province ? dealers.filter((d) => d.province === province) : dealers
  const rows = place ? byDistance(place, filtered) : filtered.map((dealer) => ({ dealer, km: null as number | null }))

  const fail = (e: unknown) => {
    if ((e as Error).name === 'AbortError') return
    const reason = e instanceof LocateFailure ? e.reason : 'network'
    setError(L.errors[reason])
  }

  const useGps = async () => {
    setBusy('gps')
    setError(null)
    try {
      setPlace(await locateMe(L.yourLocation))
    } catch (e) {
      fail(e)
    } finally {
      setBusy(null)
    }
  }

  const search = async (e: FormEvent) => {
    e.preventDefault()
    if (!query.trim()) {
      setError(L.errors.notfound)
      return
    }
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setBusy('search')
    setError(null)
    try {
      setPlace(await searchPlace(query, ctrl.signal))
      setQuery('')
    } catch (err) {
      fail(err)
    } finally {
      if (abortRef.current === ctrl) setBusy(null)
    }
  }

  const resultsText = place
    ? `${t.dealers.results(rows.length)} · ${L.sortedFrom} ${place.label}`
    : t.dealers.results(rows.length)

  return (
    <section className="section dealers" id="dealers" aria-labelledby="dealers-title">
      <div className="container dealers__grid">
        <Reveal className="dealers__intro">
          <p className="eyebrow">{t.dealers.eyebrow}</p>
          <h2 id="dealers-title" className="display display--lg">
            {t.dealers.title.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h2>
          <p className="lead">{t.dealers.lead}</p>

          <p className="dealers__count">
            {dealers.length}
            <span>{t.dealers.count}</span>
          </p>

          <ul className="dealers__services">
            {t.dealers.services.map((service) => (
              <li key={service}>
                <Check />
                {service}
              </li>
            ))}
          </ul>

          <p className="dealers__become">
            {t.dealers.become}{' '}
            <a className="text-link" href={links.becomeDealer}>
              {t.dealers.becomeCta}
            </a>
          </p>
        </Reveal>

        <div className="dealers__finder">
          <section className="locate" aria-labelledby="locate-title" aria-busy={busy !== null}>
            <h3 id="locate-title" className="locate__title">
              {L.title}
            </h3>
            <div className="locate__controls">
              <button type="button" className="btn btn--navy locate__gps" onClick={useGps} disabled={busy !== null}>
                <Locate className="btn__icon locate__gps-icon" data-busy={busy === 'gps' ? 'true' : 'false'} />
                {busy === 'gps' ? L.locating : L.useLocation}
              </button>
              <span className="locate__or" aria-hidden="true">
                {L.or}
              </span>
              <form className="locate__search" role="search" onSubmit={search} noValidate>
                <label className="locate__label" htmlFor={inputId}>
                  {L.label}
                </label>
                <div className="locate__field" data-error={error ? 'true' : 'false'}>
                  <Search className="locate__field-icon" />
                  <input
                    id={inputId}
                    type="text"
                    inputMode="search"
                    autoComplete="postal-code"
                    enterKeyHint="search"
                    placeholder={L.placeholder}
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      if (error) setError(null)
                    }}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : hintId}
                  />
                  <button type="submit" className="locate__submit" disabled={busy !== null}>
                    {busy === 'search' ? L.searching : L.search}
                  </button>
                </div>
              </form>
            </div>

            {error ? (
              <p id={errorId} className="locate__error" role="alert">
                {error}
              </p>
            ) : place ? (
              <p className="locate__status">
                <Pin aria-hidden="true" />
                <span>
                  {L.sortedFrom} <strong>{place.label}</strong> · {L.crowFlies}
                </span>
                <button type="button" className="locate__clear" onClick={() => setPlace(null)}>
                  {L.clear}
                </button>
              </p>
            ) : (
              <p id={hintId} className="locate__hint">
                {L.privacy}
              </p>
            )}
          </section>

          <div className="dealers__filter" role="group" aria-label={t.dealers.filter}>
            <p className="dealers__filter-label">{t.dealers.filter}</p>
            <div className="dealers__chips">
              <SlideChip group="province" pressed={province === null} onClick={() => setProvince(null)}>
                {t.dealers.all}
              </SlideChip>
              {provinces.map((p) => (
                <SlideChip key={p} group="province" pressed={province === p} onClick={() => setProvince(p)}>
                  {p}
                </SlideChip>
              ))}
            </div>
          </div>

          <p className="dealers__results" aria-live="polite">
            {resultsText}
          </p>

          <ul className="dealers__list" key={province ?? 'all'}>
            {rows.map(({ dealer: d, km }, i) => {
              const nearest = km !== null && i === 0
              return (
                <m.li
                  key={d.href}
                  layout="position"
                  transition={{ layout: { duration: 0.56, ease: [0.16, 1, 0.3, 1] } }}
                  style={{ animationDelay: `${Math.min(i, 10) * 35}ms` }}
                >
                  <a
                    className="dealer-card"
                    href={d.href}
                    data-importer={d.importer ? 'true' : 'false'}
                    data-nearest={nearest ? 'true' : 'false'}
                  >
                    <span className="dealer-card__top">
                      <span className="dealer-card__province">{d.province}</span>
                      {nearest && <span className="dealer-card__nearest">{L.nearest}</span>}
                      {d.importer && <span className="dealer-card__badge">{t.dealers.importer}</span>}
                    </span>
                    <strong className="dealer-card__name">{d.name}</strong>
                    <span className="dealer-card__town">
                      <Pin />
                      {d.town}
                      {km !== null && (
                        <span className="dealer-card__km">
                          {L.km(km)}
                          <span className="visually-hidden"> {L.crowFlies}</span>
                        </span>
                      )}
                    </span>
                    <span className="dealer-card__cta">
                      {t.dealers.view}
                      <ArrowUpRight />
                    </span>
                  </a>
                </m.li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
