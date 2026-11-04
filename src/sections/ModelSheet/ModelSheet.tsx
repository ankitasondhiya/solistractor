import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import './model-sheet.css'

import { useLanguage, type Lang } from '../../i18n/LanguageContext'
import { useMotion } from '../../motion/MotionContext'
import { models, type TractorModel } from '../../data/models'
import {
  holds,
  initialSelection,
  labelOf,
  loadCatalogue,
  normalize,
  priceOf,
  summarize,
  type CatalogueFile,
  type CatalogueModel,
  type ConfigControl,
  type Selection,
} from '../../data/catalogue'
import { ArrowRight, ArrowUpRight, Check, Close, Plus } from '../../components/Icons'
import { requestDemo } from '../DemoRequest/demoBus'
import { onModelSheet, type SheetTab } from './sheetBus'

const TABS: SheetTab[] = ['overview', 'specs', 'configure']
/** How long the sheet takes to leave (--dur-2 in global.css). */
const EXIT_MS = 240

export function euro(value: number, lang: Lang): string {
  return lang === 'nl' ? `€ ${value.toLocaleString('nl-NL')}` : `€${value.toLocaleString('en-GB')}`
}

/**
 * Everything solistractor.nl publishes about one model — overview, the full
 * specification, downloads and its configurator with live pricing — in a
 * side sheet over the landing page, so the reader never loses their place.
 *
 * Built to the modal rules: it slides in from the edge it belongs to and
 * leaves faster than it came; focus moves into it, is held there, and goes
 * back to whatever opened it; Escape and the backdrop close it; the page
 * behind does not scroll.
 */
export function ModelSheet() {
  const { t, l, lang } = useLanguage()
  const { lockScroll, calm, scrollTo } = useMotion()
  const [slug, setSlug] = useState<string | null>(null)
  const [tab, setTab] = useState<SheetTab>('overview')
  const [phase, setPhase] = useState<'closed' | 'open' | 'closing'>('closed')
  const [catalogue, setCatalogue] = useState<CatalogueFile | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)

  useEffect(
    () =>
      onModelSheet((nextSlug, nextTab) => {
        returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
        setSlug(nextSlug)
        setTab(nextTab)
        setPhase('open')
        loadCatalogue().then(setCatalogue)
      }),
    [],
  )

  useEffect(() => {
    if (phase !== 'open') return undefined
    lockScroll(true)
    const id = requestAnimationFrame(() => closeRef.current?.focus())
    return () => {
      cancelAnimationFrame(id)
      lockScroll(false)
    }
  }, [phase, lockScroll])

  const close = useCallback(() => {
    setPhase('closing')
    window.setTimeout(
      () => {
        setPhase('closed')
        setSlug(null)
        returnFocus.current?.focus()
      },
      calm ? 0 : EXIT_MS,
    )
  }, [calm])

  // Escape closes; Tab is held inside the panel.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      close()
      return
    }
    if (e.key !== 'Tab' || !panelRef.current) return
    const focusables = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => el.offsetParent !== null)
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (!first || !last) return
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  if (phase === 'closed' || !slug) return null

  const model = models.find((m) => m.id === slug)
  const cm = catalogue?.models.find((m) => m.slug === slug) ?? null
  if (!model) return null

  const titleId = `sheet-title-${slug}`

  return (
    <div className="sheet" data-phase={phase} onKeyDown={onKeyDown}>
      <button type="button" className="sheet__backdrop" aria-label={t.sheet.close} tabIndex={-1} onClick={close} />
      <div className="sheet__panel" ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="sheet__head">
          <div className="sheet__thumb" aria-hidden="true">
            <img src={model.image} alt="" />
          </div>
          <div className="sheet__heading">
            <p className="sheet__eyebrow">
              Solis · {l(model.category)} · {model.hp} {lang === 'nl' ? 'pk' : 'hp'}
            </p>
            <h2 id={titleId} className="display sheet__title">
              Solis {model.fullName}
            </h2>
            <p className="sheet__tagline">{l(model.tagline)}</p>
          </div>
          <div className="sheet__price">
            <span>{t.sheet.from}</span>
            <strong>{euro(model.price, lang)}</strong>
            <small>{t.sheet.vat}</small>
          </div>
          <button type="button" className="sheet__close" ref={closeRef} aria-label={t.sheet.close} onClick={close}>
            <Close />
          </button>
        </header>

        <Tabs tab={tab} onTab={setTab} slug={slug} />

        <div className="sheet__body" data-lenis-prevent="">
          {lang === 'en' && t.sheet.sourceNote && <p className="sheet__source">{t.sheet.sourceNote}</p>}
          {!cm ? (
            <SheetSkeleton label={t.sheet.loading} />
          ) : (
            <div className="sheet__pane" key={tab} role="tabpanel" id={`sheet-pane-${tab}`} aria-labelledby={`sheet-tab-${tab}`}>
              {tab === 'overview' && <Overview cm={cm} model={model} />}
              {tab === 'specs' && <Specs cm={cm} />}
              {tab === 'configure' && (
                <Configure
                  cm={cm}
                  model={model}
                  onQuote={(message) => {
                    requestDemo(model.id, message)
                    close()
                    window.setTimeout(() => scrollTo('#demo', { offset: -24 }), calm ? 0 : EXIT_MS + 40)
                  }}
                />
              )}
            </div>
          )}
        </div>

        <footer className="sheet__foot">
          <a className="text-link" href={model.href} target="_blank" rel="noreferrer">
            {t.sheet.site}
            <ArrowUpRight />
          </a>
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => {
              requestDemo(model.id)
              close()
              window.setTimeout(() => scrollTo('#demo', { offset: -24 }), calm ? 0 : EXIT_MS + 40)
            }}
          >
            {t.sheet.demo}
            <ArrowRight className="btn__icon" />
          </button>
        </footer>
      </div>
    </div>
  )
}

/* Tabs: arrow keys move between them, as a tablist should. */
function Tabs({ tab, onTab, slug }: { tab: SheetTab; onTab: (t: SheetTab) => void; slug: string }) {
  const { t } = useLanguage()
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const move = (dir: number) => {
    const i = (TABS.indexOf(tab) + dir + TABS.length) % TABS.length
    const next = TABS[i]
    if (!next) return
    onTab(next)
    refs.current[i]?.focus()
  }
  return (
    <div
      className="sheet__tabs"
      role="tablist"
      aria-label={`Solis ${slug.toUpperCase()}`}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') move(1)
        if (e.key === 'ArrowLeft') move(-1)
      }}
    >
      {TABS.map((id, i) => (
        <button
          key={id}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="button"
          role="tab"
          id={`sheet-tab-${id}`}
          aria-selected={tab === id}
          aria-controls={`sheet-pane-${id}`}
          tabIndex={tab === id ? 0 : -1}
          onClick={() => onTab(id)}
        >
          {t.sheet.tabs[id]}
        </button>
      ))}
      <span className="sheet__tab-ink" style={{ '--i': TABS.indexOf(tab) } as CSSProperties} aria-hidden="true" />
    </div>
  )
}

function SheetSkeleton({ label }: { label: string }) {
  return (
    <div className="sheet__skeleton" aria-busy="true" aria-label={label}>
      <span />
      <span />
      <span />
      <span />
    </div>
  )
}

/* Overview ------------------------------------------------------------------- */
function Overview({ cm, model }: { cm: CatalogueModel; model: TractorModel }) {
  return (
    <div className="sheet-overview">
      <p className="sheet-overview__lead">{cm.hero.text}</p>
      <figure className="sheet-overview__figure">
        <img src={model.image} alt={`Solis ${model.fullName}`} />
      </figure>

      <section className="sheet-block">
        <p className="eyebrow">{cm.intro.eyebrow}</p>
        <h3 className="sheet-block__title">{cm.intro.title}</h3>
        <p>{cm.intro.text}</p>
        <ul className="sheet-checks">
          {cm.intro.checks.map((c) => (
            <li key={c}>
              <Check />
              {c}
            </li>
          ))}
        </ul>
        {cm.intro.footnote && <p className="sheet-footnote">{cm.intro.footnote}</p>}
      </section>

      <section className="sheet-block">
        <p className="eyebrow">{cm.work.eyebrow}</p>
        <h3 className="sheet-block__title">{cm.work.title}</h3>
        <p>{cm.work.text}</p>
        <ol className="sheet-uses">
          {cm.work.items.map((item, i) => (
            <li key={item.title}>
              <span>{String(i + 1).padStart(2, '0')}</span>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

/* Specifications ------------------------------------------------------------- */
function Specs({ cm }: { cm: CatalogueModel }) {
  const { t } = useLanguage()
  const rows = cm.width ? [...cm.specs, { label: 'Breedte (standaard landbouwbanden)', value: cm.width }] : cm.specs
  return (
    <div className="sheet-specs">
      <section className="sheet-block">
        <p className="eyebrow">{t.sheet.keyFacts}</p>
        <dl className="sheet-facts">
          {cm.keyFacts.map((f) => (
            <div key={f.label}>
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="sheet-block">
        <dl className="sheet-table">
          {rows.map((r) => (
            <div key={r.label}>
              <dt>{r.label}</dt>
              <dd>{r.value}</dd>
            </div>
          ))}
        </dl>
        {cm.specsNote && <p className="sheet-footnote">{cm.specsNote}</p>}
      </section>

      <section className="sheet-block">
        <p className="eyebrow">{t.sheet.downloads}</p>
        <ul className="sheet-downloads">
          {cm.downloads.map((d) => (
            <li key={d.href}>
              <a href={d.href} target="_blank" rel="noreferrer">
                <span>
                  {d.label}
                  {d.meta && <small>{d.meta}</small>}
                </span>
                <ArrowUpRight />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

/* Configurator --------------------------------------------------------------- */
function Configure({ cm, model, onQuote }: { cm: CatalogueModel; model: TractorModel; onQuote: (message: string) => void }) {
  const { t, lang } = useLanguage()
  const cfg = cm.configurator
  const [sel, setSel] = useState<Selection>(() => initialSelection(cfg))
  const set = (key: string, value: Selection[string]) => setSel((s) => normalize(cfg, { ...s, [key]: value }))
  const { lines, total, hasOnRequest } = useMemo(() => summarize(cfg, sel), [cfg, sel])
  const shownTotal = useTweenedNumber(total)

  const priceText = (n: number | null, onRequest: boolean, delta: boolean) => {
    if (n === null) return onRequest ? t.sheet.onRequest : ''
    if (n === 0) return t.sheet.included
    return `${delta ? '+ ' : ''}${euro(n, lang)}`
  }

  const quoteMessage = () =>
    t.sheet.quoteMessage(
      model.fullName,
      lines.map((x) => `- ${x.label}${x.price ? `: ${euro(x.price, lang)}` : x.onRequest ? `: ${t.sheet.onRequest}` : ''}`).join('\n'),
      euro(total, lang),
    )

  return (
    <div className="sheet-config">
      <div className="sheet-config__steps">
        {cfg.steps.map((step, si) => (
          <fieldset key={step.title} className="config-step">
            <legend>
              <span>{String(si + 1).padStart(2, '0')}</span>
              {step.title}
            </legend>
            {step.controls.map((c) => (
              <ConfigControlView
                key={c.key}
                control={c}
                sel={sel}
                onChange={set}
                priceText={priceText}
                unavailable={t.sheet.unavailable}
                less={t.sheet.less}
                more={t.sheet.more}
              />
            ))}
          </fieldset>
        ))}
      </div>

      <aside className="sheet-config__summary" aria-live="polite">
        <p className="eyebrow">{t.sheet.summary}</p>
        <p className="config-summary__model">
          Solis {model.fullName}
        </p>
        <ul className="config-summary__lines">
          {lines.map((x) => (
            <li key={`${x.key}-${x.label}`}>
              <span>{x.label}</span>
              <strong>{priceText(x.price, x.onRequest, false)}</strong>
            </li>
          ))}
        </ul>
        <div className="config-summary__total">
          <span>{t.sheet.total}</span>
          <strong>{euro(Math.round(shownTotal), lang)}</strong>
        </div>
        {hasOnRequest && <p className="sheet-footnote">{t.sheet.onRequestNote}</p>}
        {cm.configuratorNote && <p className="sheet-footnote">{cm.configuratorNote}</p>}
        <div className="config-summary__actions">
          <button type="button" className="btn" onClick={() => onQuote(quoteMessage())}>
            {t.sheet.quote}
            <ArrowRight className="btn__icon" />
          </button>
          <button type="button" className="text-link" onClick={() => setSel(initialSelection(cfg))}>
            {t.sheet.reset}
          </button>
        </div>
      </aside>
    </div>
  )
}

interface ControlProps {
  control: ConfigControl
  sel: Selection
  onChange: (key: string, value: Selection[string]) => void
  priceText: (n: number | null, onRequest: boolean, delta: boolean) => string
  unavailable: string
  less: string
  more: string
}

function ConfigControlView({ control: c, sel, onChange, priceText, unavailable, less, more }: ControlProps) {
  const available = holds(c.when, sel)
  if (!available && c.hidden) return null
  const name = `cfg-${c.key}`

  if (c.type === 'auto') {
    if (!available) return null
    const price = priceOf(c, sel)
    return (
      <div className="config-auto">
        <Plus aria-hidden="true" />
        <span>{labelOf(c, sel)}</span>
        <strong>{priceText(price, !!c.onRequest, true)}</strong>
      </div>
    )
  }

  if (c.type === 'cards' || c.type === 'list') {
    return (
      <div className={c.type === 'cards' ? 'config-cards' : 'config-list'} role="radiogroup" aria-label={c.label || c.key}>
        {c.label && <p className="config-control__label">{c.label}</p>}
        {c.options.map((o) => {
          const ok = holds(o.when, sel)
          const price = priceOf(o, sel)
          return (
            <label key={o.value} className="config-option" data-disabled={ok ? 'false' : 'true'}>
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={sel[c.key] === o.value}
                disabled={!ok}
                onChange={() => onChange(c.key, o.value)}
              />
              {o.image && c.type === 'list' && <img src={o.image} alt="" loading="lazy" />}
              <span className="config-option__text">
                <strong>{labelOf(o, sel)}</strong>
                {(o.note || o.detail) && <small>{o.note || o.detail}</small>}
              </span>
              <span className="config-option__price">
                {c.key === 'base' && price !== null ? priceText(price, false, false) : priceText(price, !!o.onRequest, true)}
              </span>
            </label>
          )
        })}
      </div>
    )
  }

  if (c.type === 'select') {
    return (
      <label className="config-select" data-disabled={available ? 'false' : 'true'}>
        <span className="config-control__label">{labelOf(c, sel)}</span>
        <select
          value={String(sel[c.key] ?? '')}
          disabled={!available}
          onChange={(e) => onChange(c.key, e.target.value)}
        >
          {c.options
            .filter((o) => holds(o.when, sel))
            .map((o) => {
              const price = priceOf(o, sel)
              const suffix = price ? ` · + ${priceText(price, false, false)}` : o.onRequest ? ` · ${priceText(null, true, false)}` : ''
              return (
                <option key={o.value} value={o.value}>
                  {labelOf(o, sel)}
                  {suffix}
                </option>
              )
            })}
        </select>
        {!available && c.rule && <small className="config-rule">{c.rule}</small>}
      </label>
    )
  }

  if (c.type === 'check') {
    const price = priceOf(c, sel)
    return (
      <label className="config-check" data-disabled={available ? 'false' : 'true'}>
        <input
          type="checkbox"
          checked={sel[c.key] === true}
          disabled={!available}
          onChange={(e) => onChange(c.key, e.target.checked)}
        />
        <span className="config-check__box" aria-hidden="true">
          <Check />
        </span>
        <span className="config-option__text">
          <strong>{labelOf(c, sel)}</strong>
          {c.note && <small>{c.note}</small>}
          {!available && <small className="config-rule">{c.rule || unavailable}</small>}
        </span>
        <span className="config-option__price">{priceText(price, !!c.onRequest, true)}</span>
      </label>
    )
  }

  // quantity
  const n = Number(sel[c.key]) || 0
  const max = c.max ?? 9
  const unitPrice = priceOf(c, sel)
  return (
    <div className="config-quantity" data-disabled={available ? 'false' : 'true'}>
      <span className="config-option__text">
        <strong>{labelOf(c, sel)}</strong>
        {unitPrice !== null && (
          <small>
            {priceText(unitPrice, false, false)} · {c.unit}
          </small>
        )}
      </span>
      <div className="config-stepper">
        <button type="button" aria-label={`${less}: ${labelOf(c, sel)}`} disabled={!available || n <= 0} onClick={() => onChange(c.key, n - 1)}>
          −
        </button>
        <output aria-live="polite">{n}</output>
        <button type="button" aria-label={`${more}: ${labelOf(c, sel)}`} disabled={!available || n >= max} onClick={() => onChange(c.key, n + 1)}>
          +
        </button>
      </div>
    </div>
  )
}

/**
 * The total counts to its new value instead of jumping — a change in price is
 * a consequence the reader should see happen. Instant when motion is calm.
 */
function useTweenedNumber(target: number, duration = 420): number {
  const { calm } = useMotion()
  const [value, setValue] = useState(target)
  const fromRef = useRef(target)
  useEffect(() => {
    if (calm) {
      setValue(target)
      fromRef.current = target
      return undefined
    }
    const from = fromRef.current
    const start = performance.now()
    let frame = 0
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - k, 3)
      const v = from + (target - from) * eased
      setValue(v)
      fromRef.current = v
      if (k < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, calm, duration])
  return value
}
