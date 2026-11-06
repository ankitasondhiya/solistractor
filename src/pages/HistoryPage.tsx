import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import './history.css'

import { useLanguage } from '../i18n/LanguageContext'
import { useMotion } from '../motion/MotionContext'
import { useStoreEffect } from '../hooks/progressStore'
import { usePinnedProgress } from '../hooks/usePinnedProgress'
import { links } from '../data/links'
import { HISTORY_PATH, HOME } from '../router'
import { progressTop } from '../hooks/useScrollProgress'
import {
  ERAS,
  FIRST_MACHINES,
  HISTORY_COPY as C,
  MILESTONES,
  SOURCES,
  THREADS,
  TODAY,
  threadLabel,
  type Milestone,
  type Thread,
} from '../data/history'
import { ArrowDown, ArrowRight, ArrowUpRight, Pin } from '../components/Icons'
import { Reveal } from '../components/Reveal'
import { RollingNumber } from '../components/RollingNumber'
import { SlideChip } from '../components/Chip'

/**
 * /geschiedenis — the story of ITL, the maker of Solis, told as a story of
 * innovation (src/data/history.ts holds every fact and its source):
 *
 *   1  hero          "lines of gold": golden furrows drawn toward a horizon
 *                    where 1969 stands — Sonalika means "lines of gold"
 *   2  the founder   L.D. Mittal: who he was, why he started, what he won
 *   3  first         what he built first: the thresher, then — 26 years
 *                    later — the first tractor, side by side
 *   4  timeline      every milestone on one line that scrolls sideways as
 *                    the reader scrolls down (a list on phones), a giant
 *                    year rolling along behind it, the eras on a rail, and
 *                    four strands to follow: machines, factories, partners,
 *                    world
 *   5  today         the figures ITL states now, counting up
 *   6  home          2021: Solis in the Netherlands — and the way on
 *   7  sources
 */
export function HistoryPage() {
  return (
    <div className="hist">
      <Hero />
      <Founder />
      <FirstMachines />
      <Timeline />
      <Today />
      <HomeChapter />
      <Sources />
    </div>
  )
}

/** On About Solis: the way into the full story. */
export function HistoryTeaser() {
  const { l } = useLanguage()
  return (
    <section className="hist hist-teaser" aria-labelledby="hist-teaser-title">
      <div className="container">
        <Reveal className="hist-teaser__card">
          <p className="hist-teaser__years" aria-hidden="true">
            1969<span>→</span>2025
          </p>
          <div className="hist-teaser__copy">
            <p className="eyebrow eyebrow--light">{l(C.teaser.eyebrow)}</p>
            <h2 id="hist-teaser-title" className="display display--md">
              {l(C.teaser.title)}
            </h2>
            <p>{l(C.teaser.text)}</p>
          </div>
          <a className="btn" href={HISTORY_PATH}>
            {l(C.teaser.cta)}
            <ArrowRight className="btn__icon" />
          </a>
        </Reveal>
      </div>
    </section>
  )
}

/* 1 — Hero ------------------------------------------------------------------------ */
/** Furrows across a field, drawn from the horizon toward the reader. */
const FURROWS = Array.from({ length: 13 }, (_, i) => {
  const x = -900 + i * 250
  return `M600 250 L${x} 640`
})

function Hero() {
  const { t, l } = useLanguage()
  const { scrollTo } = useMotion()
  return (
    <section className="hist-hero" data-dark-hero="">
      <svg className="hist-hero__field" viewBox="0 0 1200 640" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <defs>
          <linearGradient id="hist-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f3d27a" stopOpacity="0.05" />
            <stop offset="0.35" stopColor="#e7b84a" stopOpacity="0.55" />
            <stop offset="1" stopColor="#c9952b" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <line className="hist-hero__horizon" x1="0" y1="250" x2="1200" y2="250" pathLength={1} />
        {FURROWS.map((d, i) => (
          <path key={d} d={d} pathLength={1} style={{ '--i': Math.abs(i - 6) } as CSSProperties} />
        ))}
      </svg>
      <p className="hist-hero__year" aria-hidden="true">
        1969
      </p>

      <div className="container hist-hero__inner">
        <nav className="cp-crumbs" aria-label={t.pages.breadcrumb}>
          <ol>
            <li>
              <a href={HOME}>{t.pages.home}</a>
            </li>
            <li aria-current="page">{l(C.crumb)}</li>
          </ol>
        </nav>
        <p className="eyebrow eyebrow--light">{l(C.hero.eyebrow)}</p>
        <h1 className="display hist-hero__title" tabIndex={-1} data-page-title="">
          {l(C.hero.title).map((line, i) => (
            <span key={line} style={{ '--row': i } as CSSProperties}>
              {line}
            </span>
          ))}
        </h1>
        <p className="hist-hero__lead">{l(C.hero.lead)}</p>
        <button type="button" className="hist-hero__cue" onClick={() => scrollTo('#oprichter', { offset: -24 })}>
          <ArrowDown aria-hidden="true" />
          {l(C.hero.cue)}
        </button>
      </div>
    </section>
  )
}

/* 2 — Founder ---------------------------------------------------------------------- */
function Founder() {
  const { l } = useLanguage()
  const F = C.founder
  return (
    <section className="hist-founder" id="oprichter" aria-labelledby="hist-founder-name">
      <div className="container hist-founder__grid">
        <Reveal className="hist-founder__portrait">
          <figure>
            <img src="/media/solisworld/history/ld-mittal.webp" alt={l(F.portraitAlt)} width={380} height={260} loading="lazy" decoding="async" />
          </figure>
          <aside className="hist-name">
            <p className="hist-name__kicker">{l(F.nameStory.kicker)}</p>
            <p className="hist-name__title">{l(F.nameStory.title)}</p>
            <p className="hist-name__text">{l(F.nameStory.text)}</p>
            <p className="hist-name__source">{l(F.nameStory.source)}</p>
          </aside>
        </Reveal>

        <Reveal className="hist-founder__story" delay={80}>
          <p className="eyebrow">{l(F.eyebrow)}</p>
          <h2 id="hist-founder-name" className="display display--lg">
            {F.name}
          </h2>
          <p className="hist-founder__role">
            {l(F.role)} <span>{l(F.nickname)}</span>
          </p>
          <p className="hist-founder__lead">{l(F.lead)}</p>
          <ol className="hist-ledger">
            {F.facts.map((fact, i) => (
              <li key={fact.nl}>
                <span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                {l(fact)}
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  )
}

/* 3 — What he built first --------------------------------------------------------- */
function FirstMachines() {
  const { l } = useLanguage()
  const [first, then] = FIRST_MACHINES
  return (
    <section className="hist-first" aria-labelledby="hist-first-title">
      <div className="container">
        <Reveal className="hist-first__head">
          <p className="eyebrow">{l(C.first.eyebrow)}</p>
          <h2 id="hist-first-title" className="display display--lg">
            {l(C.first.title)}
          </h2>
          <p className="hist-first__text">{l(C.first.text)}</p>
        </Reveal>

        <div className="hist-first__pair">
          {[first!, then!].map((m, i) => (
            <Reveal key={m.year} className="hist-machine" delay={i * 160}>
              <p className="hist-machine__label">
                <strong>{m.year}</strong> {l(m.label)}
              </p>
              <img src={m.image.src} alt={l(m.image.alt)} width={m.image.width} height={m.image.height} loading="lazy" decoding="async" />
              <p className="hist-machine__caption">{l(m.image.alt)}</p>
            </Reveal>
          ))}
          <p className="hist-first__gap" aria-hidden="true">
            <span>{l(C.first.gap)}</span>
            <ArrowRight />
          </p>
        </div>
      </div>
    </section>
  )
}

/* 4 — Timeline ---------------------------------------------------------------------- */
const LIST_QUERY = '(max-width: 899px)'

function Timeline() {
  const { l, lang } = useLanguage()
  const { systemReduced, scrollTo } = useMotion()
  const [list, setList] = useState(() => window.matchMedia(LIST_QUERY).matches || systemReduced)
  const [thread, setThread] = useState<Thread | null>(null)
  // A theme shows only its own milestones, so choosing one always changes what is on screen.
  const shown = useMemo(() => (thread ? MILESTONES.filter((m) => m.thread === thread) : MILESTONES), [thread])
  const [active, setActive] = useState(0)
  const [distance, setDistance] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLOListElement>(null)
  const fillRef = useRef<HTMLSpanElement>(null)
  const activeRef = useRef(0)

  useEffect(() => {
    const mq = window.matchMedia(LIST_QUERY)
    const update = () => setList(mq.matches || systemReduced)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [systemReduced])

  // How far the line has to travel: its full length less the window.
  useLayoutEffect(() => {
    const track = trackRef.current
    const viewport = viewportRef.current
    if (list || !track || !viewport) {
      setDistance(0)
      return undefined
    }
    const measure = () => setDistance(Math.max(0, track.scrollWidth - viewport.clientWidth))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(track)
    ro.observe(viewport)
    return () => ro.disconnect()
  }, [list, lang, thread])

  const store = usePinnedProgress(sectionRef, !list && distance > 0)

  useStoreEffect(store, (p) => {
    const track = trackRef.current
    if (list || !track) return
    track.style.transform = `translate3d(${(-distance * p).toFixed(1)}px, 0, 0)`
    fillRef.current?.style.setProperty('--p', p.toFixed(4))
    // The milestone nearest the reading line (40% across) is the one "now".
    const cards = track.children
    const line = window.innerWidth * 0.4
    let best = 0
    let bestGap = Infinity
    for (let i = 0; i < cards.length; i++) {
      const r = (cards[i] as HTMLElement).getBoundingClientRect()
      const gap = Math.abs(r.left + r.width / 2 - line)
      if (gap < bestGap) {
        bestGap = gap
        best = i
      }
    }
    if (best !== activeRef.current) {
      activeRef.current = best
      setActive(best)
    }
  })

  const year = shown[active]?.year ?? shown[0]?.year ?? 1969
  // The rail: each era as wide as its share of the milestones on the line, and where it starts.
  const eras = useMemo(
    () =>
      ERAS.map((e) => {
        const inEra = shown.filter((m) => m.year >= e.from && m.year <= e.to)
        return { ...e, size: Math.max(inEra.length, 0.6), first: inEra[0] ? shown.indexOf(inEra[0]) : -1 }
      }),
    [shown],
  )

  /** Moves the line until milestone `index` stands at the reading line (on a phone: scrolls to it). */
  const goTo = (index: number) => {
    const track = trackRef.current
    const viewport = viewportRef.current
    const card = track?.children[index] as HTMLElement | undefined
    if (!card || !viewport) return
    if (list || distance <= 0) {
      scrollTo(card, { offset: -96 })
      return
    }
    const p = Math.min(Math.max((card.offsetLeft + card.offsetWidth / 2 - viewport.clientWidth * 0.4) / distance, 0), 1)
    const top = progressTop(sectionRef, p)
    if (top !== null) scrollTo(top)
  }

  /** A theme (or all of them): the line starts again from its first milestone. */
  const choose = (next: Thread | null) => {
    if (next === thread) return
    const section = sectionRef.current
    if (section && !list) {
      const top = section.getBoundingClientRect().top + window.scrollY
      if (window.scrollY > top + 1) scrollTo(top, { immediate: true })
    }
    activeRef.current = 0
    setActive(0)
    setThread(next)
  }

  return (
    <section
      className="hist-line"
      ref={sectionRef}
      data-mode={list ? 'list' : 'track'}
      style={{ '--distance': `${distance}px` } as CSSProperties}
      aria-labelledby="hist-line-title"
    >
      <div className="hist-line__viewport" ref={viewportRef}>
        <div className="container hist-line__head">
          <div>
            <p className="eyebrow eyebrow--light">{l(C.timeline.eyebrow)}</p>
            <h2 id="hist-line-title" className="display display--md">
              {l(C.timeline.title)}
            </h2>
          </div>
          <div className="hist-line__filter">
            <p className="hist-line__filter-label" id="hist-filter-label">
              {l(C.timeline.filterLabel)} <span aria-live="polite">· {C.timeline.count[lang](shown.length)}</span>
            </p>
            <div className="hist-line__chips" role="group" aria-labelledby="hist-filter-label">
              <SlideChip group="history" pressed={thread === null} onClick={() => choose(null)}>
                {l(threadLabel.all)}
              </SlideChip>
              {THREADS.map((th) => (
                <SlideChip key={th} group="history" pressed={thread === th} onClick={() => choose(th)}>
                  <span className="hist-dot" data-thread={th} aria-hidden="true" />
                  {l(threadLabel[th])}
                </SlideChip>
              ))}
            </div>
          </div>
        </div>

        <div className="hist-line__stage">
          <ol className="hist-line__track" ref={trackRef} key={thread ?? 'all'}>
            {shown.map((m, i) => (
              <MilestoneCard
                key={`${m.year}-${m.thread}`}
                m={m}
                active={!list && i === active}
                current={thread}
                onTheme={choose}
              />
            ))}
          </ol>
        </div>

        {/* The scrubber: the year at the reading line, rolling as the line
            moves, and the eras — each one a way to jump there. */}
        {!list && (
          <nav className="container hist-line__rail" aria-label={l(C.timeline.erasLabel)}>
            <p className="hist-line__now" aria-hidden="true">
              <RollingNumber value={year} format={(n) => String(Math.round(n))} duration={520} />
            </p>
            <div className="hist-line__eras">
              <span className="hist-line__fill" ref={fillRef} aria-hidden="true" />
              {eras.map((e) => (
                <button
                  key={e.from}
                  type="button"
                  className="hist-line__era"
                  data-current={year >= e.from && year <= e.to ? 'true' : 'false'}
                  aria-current={year >= e.from && year <= e.to ? 'step' : undefined}
                  disabled={e.first < 0}
                  onClick={() => goTo(e.first)}
                  style={{ flexGrow: e.size } as CSSProperties}
                >
                  <strong>
                    {e.from}–{e.to}
                  </strong>
                  {l(e.title)}
                </button>
              ))}
            </div>
          </nav>
        )}
      </div>
    </section>
  )
}

function MilestoneCard({
  m,
  active,
  current,
  onTheme,
}: {
  m: Milestone
  active: boolean
  /** the theme the line is showing, if any */
  current: Thread | null
  onTheme: (theme: Thread | null) => void
}) {
  const { l } = useLanguage()
  const on = current === m.thread
  return (
    <li
      className="hist-card"
      data-thread={m.thread}
      data-active={active ? 'true' : 'false'}
      data-home={m.home ? 'true' : 'false'}
      data-image={m.image ? 'true' : 'false'}
    >
      <Reveal className="hist-card__inner">
        {m.image && (
          <figure className="hist-card__pic" data-kind={m.image.kind}>
            <img src={m.image.src} alt={l(m.image.alt)} width={m.image.width} height={m.image.height} loading="lazy" decoding="async" />
          </figure>
        )}
        <p className="hist-card__meta">
          <span className="hist-card__year">{m.year}</span>
          {/* The theme tag filters the line to that theme; pressed again, back to all. */}
          <button
            type="button"
            className="hist-card__thread"
            aria-pressed={on}
            title={on ? l(C.timeline.showAll) : `${l(C.timeline.showOnly)} ${l(threadLabel[m.thread])}`}
            onClick={() => onTheme(on ? null : m.thread)}
          >
            <span className="hist-dot" data-thread={m.thread} aria-hidden="true" />
            {l(threadLabel[m.thread])}
          </button>
        </p>
        <h3 className="hist-card__title">{l(m.title)}</h3>
        <p className="hist-card__text">{l(m.text)}</p>
        {m.home && (
          <p className="hist-card__home">
            <Pin aria-hidden="true" />
            {l(C.timeline.home)}
          </p>
        )}
      </Reveal>
    </li>
  )
}

/* 5 — Today -------------------------------------------------------------------------- */
function Today() {
  const { l, lang } = useLanguage()
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) {
      setShown(true)
      return undefined
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const locale = lang === 'nl' ? 'nl-NL' : 'en-GB'
  return (
    <section className="hist-today" aria-labelledby="hist-today-title">
      <div className="container">
        <Reveal className="hist-today__head">
          <p className="eyebrow eyebrow--light">{l(C.today.eyebrow)}</p>
          <h2 id="hist-today-title" className="display display--md">
            {l(C.today.title)}
          </h2>
        </Reveal>
        <div className="hist-today__grid" ref={ref}>
          {TODAY.map((f) => (
            <div key={f.label.en} className="hist-figure">
              <p className="hist-figure__value">
                {/* Counts up once, when the figures come into view; a screen
                    reader gets the figure itself, never the count. */}
                <span aria-hidden="true">
                  <RollingNumber
                    value={shown ? f.value : 0}
                    format={(n) => `${Math.round(n).toLocaleString(locale)}${f.suffix ?? ''}`}
                    duration={1400}
                  />
                </span>
                <span className="visually-hidden">{`${f.value.toLocaleString(locale)}${f.suffix ?? ''}`}</span>
              </p>
              <p className="hist-figure__label">{l(f.label)}</p>
            </div>
          ))}
        </div>
        <p className="hist-today__note">{l(C.today.note)}</p>
      </div>
    </section>
  )
}

/* 6 — The Netherlands ------------------------------------------------------------- */
function HomeChapter() {
  const { l } = useLanguage()
  return (
    <section className="hist-home" aria-labelledby="hist-home-title">
      <div className="container hist-home__inner">
        <Reveal className="hist-home__year">
          <span aria-hidden="true">2021</span>
        </Reveal>
        <Reveal className="hist-home__copy" delay={80}>
          <p className="eyebrow">{l(C.home.eyebrow)}</p>
          <h2 id="hist-home-title" className="display display--md">
            {l(C.home.title)}
          </h2>
          <p className="hist-home__text">{l(C.home.text)}</p>
          <div className="cp-actions">
            <a className="btn" href={links.models}>
              {l(C.home.models)}
              <ArrowRight className="btn__icon" />
            </a>
            <a className="btn btn--ghost" href={links.dealers}>
              {l(C.home.dealers)}
              <ArrowRight className="btn__icon" />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* 7 — Sources ------------------------------------------------------------------------ */
function Sources() {
  const { t, l } = useLanguage()
  return (
    <section className="hist-sources" aria-labelledby="hist-sources-title">
      <div className="container">
        <h2 id="hist-sources-title" className="hist-sources__title">
          {l(C.sources.title)}
        </h2>
        <ul className="hist-sources__list">
          {SOURCES.map((s) => (
            <li key={s.href}>
              <a href={s.href} target="_blank" rel="noopener noreferrer">
                {s.label}
                <ArrowUpRight aria-hidden="true" />
                <span className="visually-hidden"> {t.pages.external}</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="hist-sources__note">{l(C.sources.note)}</p>
      </div>
    </section>
  )
}
