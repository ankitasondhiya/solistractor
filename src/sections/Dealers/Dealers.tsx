import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { m } from 'motion/react'
import './dealers.css'

import { useLanguage } from '../../i18n/LanguageContext'
import { byDistance, dealers, provinces, type Province } from '../../data/dealers'
import { links } from '../../data/links'
import { ArrowDown, ArrowUpRight, Check, Locate, Pin, Search } from '../../components/Icons'
import { Reveal } from '../../components/Reveal'
import { SlideChip } from '../../components/Chip'
import { setPlace, usePersonal } from '../../personal/personal'
import { LocateFailure, locateMe, searchPlace } from '../../personal/locate'
import { useMotion } from '../../motion/MotionContext'

type Busy = 'gps' | 'search' | null

/**
 * How many dealers the list shows before "Show all": three rows of two —
 * once the reader has said where they are, the six nearest.
 */
const FIRST = 6

/**
 * Section 07 — the twenty dealers. The reader can say where they are (their
 * browser's location, or a postcode / town) and the list re-sorts nearest
 * first, each card gliding to its new place; the province filter still
 * narrows it. The place is remembered on this device for the next visit and
 * for the demo form. The list opens on its first six; the rest are one
 * press away, and a new filter or place starts short again.
 */
export function Dealers() {
  const { t } = useLanguage()
  const { scrollTo } = useMotion()
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
  const listId = useId()
  const listRef = useRef<HTMLUListElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  const filtered = province ? dealers.filter((d) => d.province === province) : dealers
  const rows = place ? byDistance(place, filtered) : filtered.map((dealer) => ({ dealer, km: null as number | null }))

  // Opened for one filter and place only: changing either starts short again.
  const view = `${province ?? 'all'}|${place?.label ?? ''}`
  const [openFor, setOpenFor] = useState<string | null>(null)
  const expanded = openFor === view
  const collapsible = rows.length > FIRST
  const visible = expanded || !collapsible ? rows : rows.slice(0, FIRST)

  // What the press should do once the list has re-rendered: show the first
  // new dealer (and move focus to it), or keep the button where it was.
  const after = useRef<{ focus: boolean } | { anchor: number } | null>(null)
  useLayoutEffect(() => {
    const job = after.current
    after.current = null
    if (!job) return
    if ('focus' in job) {
      listRef.current?.children[FIRST]?.querySelector('a')?.focus({ preventScroll: true })
      return
    }
    // Fewer cards above the button: scroll by what they took, so the button
    // stays under the pointer and the first six are right above it.
    const top = toggleRef.current?.getBoundingClientRect().top
    if (top !== undefined) scrollTo(window.scrollY + (top - job.anchor), { immediate: true })
  }, [expanded, scrollTo])

  const toggle = () => {
    if (expanded) {
      after.current = { anchor: toggleRef.current?.getBoundingClientRect().top ?? 0 }
      setOpenFor(null)
    } else {
      after.current = { focus: true }
      setOpenFor(view)
    }
  }

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

          <ul className="dealers__list" id={listId} ref={listRef} key={province ?? 'all'}>
            {visible.map(({ dealer: d, km }, i) => {
              const nearest = km !== null && i === 0
              // The cards "Show all" adds arrive one after another, from the first new one.
              const step = expanded && i >= FIRST ? i - FIRST : i
              return (
                <m.li
                  key={d.href}
                  layout="position"
                  transition={{ layout: { duration: 0.56, ease: [0.16, 1, 0.3, 1] } }}
                  style={{ animationDelay: `${Math.min(step, 10) * 40}ms` }}
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

          {collapsible && (
            <div className="dealers__more">
              <p className="dealers__progress">
                <span>{t.dealers.shown(visible.length, rows.length)}</span>
                <span
                  className="dealers__progress-bar"
                  aria-hidden="true"
                  style={{ '--p': visible.length / rows.length } as CSSProperties}
                >
                  <span />
                </span>
              </p>
              <button
                ref={toggleRef}
                type="button"
                className="btn btn--ghost dealers__toggle"
                aria-expanded={expanded}
                aria-controls={listId}
                onClick={toggle}
              >
                {expanded ? t.dealers.showFewer : t.dealers.showAll(rows.length)}
                <ArrowDown className="btn__icon dealers__toggle-icon" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
