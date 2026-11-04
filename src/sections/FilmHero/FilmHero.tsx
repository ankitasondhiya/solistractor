import { useCallback, useEffect, useMemo, useRef, type CSSProperties, type RefObject } from 'react'
import './film-hero.css'

import {
  ProgressContext,
  createProgressStore,
  useProgressEffect,
  type ProgressStore,
} from '../../hooks/progressStore'
import { progressTop, useScrollProgress } from '../../hooks/useScrollProgress'
import { useFrameSequence } from '../../hooks/useFrameSequence'
import { useMagnetic } from '../../hooks/useMagnetic'
import { CHAPTERS, PRELOAD_FRAMES, frameAt, frameUrls, zoomAt, type FrameSize } from '../../data/filmTimeline'
import { INTRO, chapterAlpha, chapterKicker, chapterTarget, type ChapterTiming } from '../../data/timeline'
import { useLanguage } from '../../i18n/LanguageContext'
import { useMotion } from '../../motion/MotionContext'
import { preload } from '../../motion/preload'
import { ArrowDown, ArrowRight, Shield } from '../../components/Icons'
import { HeroStatic } from '../HeroStatic/HeroStatic'

/**
 * Full 1080p frames everywhere, except where the browser says the connection
 * is slow or the reader has asked to save data.
 */
function chooseSize(): FrameSize {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
    .connection
  if (connection?.saveData) return 'md'
  if (connection?.effectiveType && /(^|-)2g|3g/.test(connection.effectiveType)) return 'md'
  return 'lg'
}

/**
 * Section 01 — the film, scrubbed by scroll.
 *
 * A Solis S75 is built and put to work: axle, body, driver, lights, a tyre in
 * macro, then a field at sunrise. The picture fills the screen; the copy sits
 * low on the left over a soft scrim, one chapter at a time, and the rest of
 * the interface is a hairline rail. The scroll machinery is the Hitachi
 * hero's.
 */
export function FilmHero() {
  const { systemReduced } = useMotion()
  const store = useMemo(() => createProgressStore(), [])
  // Chosen once per visit: swapping sets mid-scroll would refetch everything.
  const size = useMemo(chooseSize, [])
  const urls = useMemo(() => (systemReduced ? [] : frameUrls(size)), [size, systemReduced])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onProgress = useCallback((settled: number, count: number) => {
    preload.set(Math.min(1, settled / Math.min(count, PRELOAD_FRAMES)))
  }, [])
  const sequence = useFrameSequence({ urls, canvasRef, onProgress })
  const staticMode = systemReduced || sequence.failed

  useEffect(() => {
    if (staticMode) preload.set(1)
  }, [staticMode])

  return (
    <ProgressContext.Provider value={store}>
      {staticMode ? (
        <HeroStatic
          failed={!systemReduced && sequence.failed}
          tone="dark"
          image="/media/film/tractor-studio.webp"
          chapterIds={CHAPTERS.map((c) => c.id)}
        />
      ) : (
        <AssemblyStory store={store} canvasRef={canvasRef} draw={sequence.draw} ready={sequence.ready} />
      )}
    </ProgressContext.Provider>
  )
}

interface FilmProps {
  canvasRef: RefObject<HTMLCanvasElement>
  draw: (index: number) => void
  ready: boolean
}

function AssemblyStory({ store, canvasRef, draw, ready }: FilmProps & { store: ProgressStore }) {
  const { t } = useLanguage()
  const { calm, scrollTo } = useMotion()
  const sectionRef = useRef<HTMLElement>(null)

  useScrollProgress({ sectionRef, store, enabled: true, smoothing: calm ? 0.14 : 0.32 })

  const jump = (id: string) => scrollTo(id, { offset: -24 })
  const seek = (c: ChapterTiming) => {
    const top = progressTop(sectionRef, chapterTarget(c))
    if (top !== null) scrollTo(top)
  }

  return (
    <section className="film" ref={sectionRef} id="top" aria-labelledby="film-title">
      <div className="film__viewport">
        <Film canvasRef={canvasRef} draw={draw} ready={ready} />
        <div className="film__scrim" aria-hidden="true" />

        <div className="film__ui">
          <Intro onJump={jump} />
          {CHAPTERS.map((timing, i) => (
            <Chapter key={timing.id} timing={timing} index={i} onJump={jump} />
          ))}
          <Rail onSeek={seek} />
          <Progress />
        </div>
      </div>

      {/* The chapters as plain text, for screen readers and search engines:
          the animated copy above is decorative timing over the same words. */}
      <div className="visually-hidden">
        {CHAPTERS.map(({ id }) => t.hero.chapters.find((c) => c.id === id)).map((c) => c && (
          <section key={c.id}>
            <h2>{c.title.join(' ')}</h2>
            <p>{c.body}</p>
          </section>
        ))}
      </div>
    </section>
  )
}

/* The picture --------------------------------------------------------------- */
function Film({ canvasRef, draw, ready }: FilmProps) {
  const frameRef = useRef<HTMLDivElement>(null)

  useProgressEffect((p) => {
    draw(frameAt(p))
    if (frameRef.current) frameRef.current.style.transform = `scale(${zoomAt(p).toFixed(4)})`
  })

  return (
    <div className="film__frame" ref={frameRef} aria-hidden="true">
      <canvas ref={canvasRef} className="film__canvas" data-ready={ready ? 'true' : 'false'} />
    </div>
  )
}

/* Copy ---------------------------------------------------------------------- */
function useAlpha(ref: RefObject<HTMLElement | null>, alphaAt: (p: number) => number) {
  useProgressEffect((p) => {
    const el = ref.current
    if (!el) return
    const a = alphaAt(p)
    el.style.setProperty('--a', a.toFixed(3))
    el.style.visibility = a < 0.01 ? 'hidden' : 'visible'
  })
}

function Intro({ onJump }: { onJump: (id: string) => void }) {
  const { t } = useLanguage()
  const ref = useRef<HTMLDivElement>(null)
  const magnet = useMagnetic<HTMLSpanElement>()
  useAlpha(ref, (p) => (p <= INTRO.hold ? 1 : 1 - Math.min(1, (p - INTRO.hold) / (INTRO.exit - INTRO.hold))))

  return (
    <div className="film__intro" ref={ref}>
      <div className="film__intro-top">
        <p className="film__warranty film__enter" style={{ '--d': '640ms' } as CSSProperties}>
          <Shield />
          {t.utility.warranty}
        </p>
        <p className="film__cue film__enter" style={{ '--d': '760ms' } as CSSProperties} aria-hidden="true">
          {t.hero.scroll}
          <ArrowDown />
        </p>
      </div>

      <div className="film__intro-main">
        <p className="film__label film__enter" style={{ '--d': '0ms' } as CSSProperties}>
          {t.hero.eyebrow}
        </p>
        <h1 id="film-title" className="display film__title">
          {t.hero.title.map((line, i) => (
            <span key={line} className="film__line">
              <span className="film__enter" style={{ '--d': `${120 + i * 110}ms` } as CSSProperties}>
                {line}
              </span>
            </span>
          ))}
        </h1>
        <div className="film__intro-foot">
          <p className="film__lead film__enter" style={{ '--d': '420ms' } as CSSProperties}>
            {t.hero.lead}
          </p>
          <div className="film__actions film__enter" style={{ '--d': '520ms' } as CSSProperties}>
            <span className="magnet" ref={magnet}>
              <a
                className="btn"
                href="#modellen"
                onClick={(e) => {
                  e.preventDefault()
                  onJump('#modellen')
                }}
              >
                {t.hero.primary}
                <ArrowRight className="btn__icon" />
              </a>
            </span>
            <a
              className="btn btn--ghost-light"
              href="#keuzehulp"
              onClick={(e) => {
                e.preventDefault()
                onJump('#keuzehulp')
              }}
            >
              {t.hero.secondary}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function Chapter({
  timing,
  index,
  onJump,
}: {
  timing: ChapterTiming
  index: number
  onJump: (id: string) => void
}) {
  const { t } = useLanguage()
  const chapter = t.hero.chapters.find((c) => c.id === timing.id)
  const ref = useRef<HTMLDivElement>(null)
  const last = index === CHAPTERS.length - 1
  useAlpha(ref, (p) => chapterAlpha(p, timing))

  if (!chapter) return null

  return (
    <div className="film__chapter" ref={ref} aria-hidden="true">
      <p className="film__label">{chapterKicker(index, chapter.label)}</p>
      <p className="display film__chapter-title">
        {chapter.title.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </p>
      <p className="film__chapter-body">{chapter.body}</p>
      <dl className="film__stats">
        {chapter.facts.map((fact) => (
          <div key={fact.label}>
            <dd>
              {fact.value}
              {fact.unit && <small>{fact.unit}</small>}
            </dd>
            <dt>{fact.label}</dt>
          </div>
        ))}
      </dl>
      {last && (
        <a
          className="btn film__chapter-cta"
          href="#modellen"
          tabIndex={-1}
          onClick={(e) => {
            e.preventDefault()
            onJump('#modellen')
          }}
        >
          {t.hero.primary}
          <ArrowRight className="btn__icon" />
        </a>
      )}
    </div>
  )
}

/* Chapter rail and progress ------------------------------------------------- */
function Rail({ onSeek }: { onSeek: (c: ChapterTiming) => void }) {
  const { t } = useLanguage()
  const listRef = useRef<HTMLOListElement>(null)
  const navRef = useRef<HTMLElement>(null)

  useProgressEffect((p) => {
    if (navRef.current) navRef.current.dataset.show = p > INTRO.exit * 0.6 ? 'true' : 'false'
    const items = listRef.current?.children
    if (!items) return
    let active = -1
    CHAPTERS.forEach((c, i) => {
      if (p >= c.enter - 0.02) active = i
    })
    Array.from(items).forEach((item, i) => {
      ;(item as HTMLElement).dataset.state = i === active ? 'active' : i < active ? 'done' : 'todo'
    })
  })

  return (
    <nav className="film__rail" ref={navRef} aria-label={t.hero.progressLabel}>
      <ol ref={listRef}>
        {CHAPTERS.map((c, i) => (
          <li key={c.id}>
            <button type="button" onClick={() => onSeek(c)}>
              <span className="film__rail-name">{t.hero.chapters.find((x) => x.id === c.id)?.nav}</span>
              <span className="film__rail-num">{String(i + 1).padStart(2, '0')}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}

function Progress() {
  const ref = useRef<HTMLSpanElement>(null)
  useProgressEffect((p) => {
    if (ref.current) ref.current.style.transform = `scaleX(${p.toFixed(4)})`
  })
  return (
    <span className="film__progress" aria-hidden="true">
      <span ref={ref} />
    </span>
  )
}
