import { useCallback, useEffect, useMemo, useRef, type CSSProperties, type RefObject } from 'react'
import './studio-hero.css'

import {
  ProgressContext,
  createProgressStore,
  useProgressEffect,
  type ProgressStore,
} from '../../hooks/progressStore'
import { progressTop, useScrollProgress } from '../../hooks/useScrollProgress'
import { useFrameSequence } from '../../hooks/useFrameSequence'
import { useMagnetic } from '../../hooks/useMagnetic'
import {
  CHAPTERS,
  PRELOAD_FRAMES,
  cameraAt,
  frameAt,
  frameUrls,
  type FrameSize,
  type StudioChapter,
} from '../../data/studioTimeline'
import { INTRO, chapterAlpha, chapterKicker, chapterTarget } from '../../data/timeline'
import { useLanguage } from '../../i18n/LanguageContext'
import { useMotion } from '../../motion/MotionContext'
import { preload } from '../../motion/preload'
import { ArrowDown, ArrowRight, Shield } from '../../components/Icons'
import { HeroStatic } from '../HeroStatic/HeroStatic'

const MOBILE_QUERY = '(max-width: 899px)'

/**
 * Section 01, studio edition (`/studio`) — the tractor builds itself as the
 * reader scrolls.
 *
 * Three layers in one pinned viewport, bottom to top:
 *   1  words        the intro headline, then one giant word per chapter, solid
 *                   navy on the cream studio
 *   2  the machine  the frame sequence — cut out of its studio, so it stands
 *                   in front of the word and covers part of it
 *   3  interface    a small chapter label, floating fact cards, callouts,
 *                   the pagination dots
 *
 * The scroll machinery is the Hitachi hero's; the composition — product in
 * front of an oversized word, almost nothing else on screen — follows the
 * "Pour / Play" reference.
 */
export function StudioHero() {
  const { systemReduced } = useMotion()
  const store = useMemo(() => createProgressStore(), [])
  // Chosen once per visit: swapping sets mid-scroll would refetch everything.
  const size = useMemo<FrameSize>(() => (window.matchMedia(MOBILE_QUERY).matches ? 'sm' : 'lg'), [])
  const urls = useMemo(() => (systemReduced ? [] : frameUrls(size)), [size, systemReduced])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onProgress = useCallback((settled: number, count: number) => {
    preload.set(Math.min(1, settled / Math.min(count, PRELOAD_FRAMES)))
  }, [])
  const sequence = useFrameSequence({ urls, canvasRef, onProgress, fit: 'frame' })
  const staticMode = systemReduced || sequence.failed

  useEffect(() => {
    if (staticMode) preload.set(1)
  }, [staticMode])

  return (
    <ProgressContext.Provider value={store}>
      {staticMode ? (
        <HeroStatic
          failed={!systemReduced && sequence.failed}
          tone="light"
          image="/media/studio/tractor-complete.webp"
          chapterIds={CHAPTERS.map((c) => c.id)}
        />
      ) : (
        <AssemblyStory store={store} canvasRef={canvasRef} draw={sequence.draw} ready={sequence.ready} />
      )}
    </ProgressContext.Provider>
  )
}

interface StageProps {
  canvasRef: RefObject<HTMLCanvasElement>
  draw: (index: number) => void
  ready: boolean
}

function useChapterCopy(id: string) {
  const { t } = useLanguage()
  return t.hero.chapters.find((c) => c.id === id)
}

function AssemblyStory({ store, canvasRef, draw, ready }: StageProps & { store: ProgressStore }) {
  const { t } = useLanguage()
  const { calm, scrollTo } = useMotion()
  const sectionRef = useRef<HTMLElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)

  useScrollProgress({ sectionRef, store, enabled: true, smoothing: calm ? 0.14 : 0.32 })

  const jump = (id: string) => scrollTo(id, { offset: -24 })
  const seek = (c: StudioChapter) => {
    const top = progressTop(sectionRef, chapterTarget(c))
    if (top !== null) scrollTo(top)
  }

  return (
    <section className="assembly" ref={sectionRef} id="top" aria-labelledby="assembly-title">
      <div className="assembly__viewport" ref={viewportRef}>
        <Words />
        <Stage canvasRef={canvasRef} draw={draw} ready={ready} />

        <div className="assembly__ui">
          <IntroFoot onJump={jump} />
          {CHAPTERS.map((timing, i) => (
            <ChapterCopy key={timing.id} timing={timing} index={i} onJump={jump} />
          ))}
          <Callouts canvasRef={canvasRef} viewportRef={viewportRef} />
          <Dots onSeek={seek} />
          <Badge />
        </div>
      </div>

      {/* The chapters as plain text, for screen readers and search engines:
          the animated copy above is decorative timing over the same words. */}
      <div className="visually-hidden">
        {CHAPTERS.map(({ id }) => t.hero.chapters.find((c) => c.id === id)).map(
          (c) =>
            c && (
              <section key={c.id}>
                <h2>{c.title.join(' ')}</h2>
                <p>{c.body}</p>
              </section>
            ),
        )}
      </div>
    </section>
  )
}

/* Layer 2 — the machine ----------------------------------------------------- */
function Stage({ canvasRef, draw, ready }: StageProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const mobile = useMobileRef()

  useProgressEffect((p) => {
    draw(frameAt(p))
    const stage = stageRef.current
    if (!stage) return
    const cam = cameraAt(p, mobile.current, window.innerWidth / window.innerHeight)
    stage.style.transform = `translate3d(${cam.x.toFixed(3)}vw, ${cam.y.toFixed(3)}vh, 0) scale(${cam.scale.toFixed(4)})`
  })

  return (
    <div className="assembly__stage" ref={stageRef} aria-hidden="true">
      <canvas
        ref={canvasRef}
        className="assembly__canvas"
        data-ready={ready ? 'true' : 'false'}
        width={1280}
        height={720}
      />
    </div>
  )
}

/* Layer 1 — the words ------------------------------------------------------- */
function Words() {
  const { t } = useLanguage()
  const introRef = useRef<HTMLDivElement>(null)
  const refs = useRef<(HTMLSpanElement | null)[]>([])

  useProgressEffect((p) => {
    const intro = introRef.current
    if (intro) {
      const a = p <= INTRO.hold ? 1 : 1 - Math.min(1, (p - INTRO.hold) / (INTRO.exit - INTRO.hold))
      intro.style.setProperty('--a', a.toFixed(3))
      intro.style.visibility = a < 0.01 ? 'hidden' : 'visible'
    }
    CHAPTERS.forEach((c, i) => {
      const el = refs.current[i]
      if (!el) return
      const a = chapterAlpha(p, c)
      el.style.setProperty('--a', a.toFixed(3))
      el.style.visibility = a < 0.01 ? 'hidden' : 'visible'
    })
  })

  return (
    <div className="assembly__words">
      <div className="assembly__intro-title" ref={introRef}>
        <p className="assembly__label assembly__enter" style={{ '--d': '0ms' } as CSSProperties}>
          {t.hero.eyebrow}
        </p>
        <h1 id="assembly-title" className="display assembly__title">
          {t.hero.title.map((line, i) => (
            <span key={line} className="assembly__line">
              <span className="assembly__enter" style={{ '--d': `${120 + i * 110}ms` } as CSSProperties}>
                {line}
              </span>
            </span>
          ))}
        </h1>
      </div>

      {CHAPTERS.map((timing, i) => {
        const word = t.hero.chapters.find((c) => c.id === timing.id)?.ghost ?? ''
        return (
          <span
            key={timing.id}
            className="assembly__word"
            aria-hidden="true"
            style={{ '--len': word.length } as CSSProperties}
            ref={(el) => {
              refs.current[i] = el
            }}
          >
            {word}
          </span>
        )
      })}
    </div>
  )
}

/* Layer 3 — interface ------------------------------------------------------- */
function IntroFoot({ onJump }: { onJump: (id: string) => void }) {
  const { t } = useLanguage()
  const ref = useRef<HTMLDivElement>(null)
  const magnet = useMagnetic<HTMLSpanElement>()

  useProgressEffect((p) => {
    const el = ref.current
    if (!el) return
    const a = p <= INTRO.hold ? 1 : 1 - Math.min(1, (p - INTRO.hold) / (INTRO.exit - INTRO.hold))
    el.style.setProperty('--a', a.toFixed(3))
    el.style.visibility = a < 0.01 ? 'hidden' : 'visible'
  })

  return (
    <div className="assembly__intro" ref={ref}>
      <div className="assembly__intro-foot">
        <div className="assembly__intro-copy assembly__enter" style={{ '--d': '420ms' } as CSSProperties}>
          <p className="assembly__pill">
            <Shield />
            {t.utility.warranty}
          </p>
          <p className="assembly__lead">{t.hero.lead}</p>
        </div>
        <div className="assembly__actions assembly__enter" style={{ '--d': '520ms' } as CSSProperties}>
          <span className="magnet" ref={magnet}>
            <a
              className="btn btn--navy"
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
            className="btn btn--ghost"
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
  )
}

function ChapterCopy({
  timing,
  index,
  onJump,
}: {
  timing: StudioChapter
  index: number
  onJump: (id: string) => void
}) {
  const { t } = useLanguage()
  const chapter = useChapterCopy(timing.id)
  const ref = useRef<HTMLDivElement>(null)
  const last = index === CHAPTERS.length - 1

  useProgressEffect((p) => {
    const el = ref.current
    if (!el) return
    const a = chapterAlpha(p, timing)
    el.style.setProperty('--a', a.toFixed(3))
    el.style.visibility = a < 0.01 ? 'hidden' : 'visible'
  })

  if (!chapter) return null

  return (
    <div className="assembly__chapter" data-last={last ? 'true' : 'false'} ref={ref} aria-hidden="true">
      <div className="assembly__chapter-copy">
        <p className="assembly__label">{chapterKicker(index, chapter.label)}</p>
        <p className="assembly__chapter-title">{chapter.title.join(' ')}</p>
        <p className="assembly__chapter-body">{chapter.body}</p>
        {last && (
          <a
            className="btn btn--navy assembly__chapter-cta"
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

      {chapter.facts.map((fact, i) => (
        <dl key={fact.label} className="assembly__card" data-slot={i}>
          <dt>{fact.label}</dt>
          <dd>
            {fact.value}
            {fact.unit && <small>{fact.unit}</small>}
          </dd>
        </dl>
      ))}
    </div>
  )
}

/* Callouts: a dot on the part, a hairline, and its name ---------------------- */
function Callouts({
  canvasRef,
  viewportRef,
}: {
  canvasRef: RefObject<HTMLCanvasElement | null>
  viewportRef: RefObject<HTMLDivElement | null>
}) {
  const { t } = useLanguage()
  const items = CHAPTERS.map((c) => ({ timing: c, tag: t.hero.chapters.find((x) => x.id === c.id)?.tag ?? '' })).filter(
    (item) => item.timing.anchor && item.tag,
  )
  const dots = useRef<(HTMLSpanElement | null)[]>([])
  const tags = useRef<(HTMLSpanElement | null)[]>([])
  const lines = useRef<(SVGLineElement | null)[]>([])

  useProgressEffect((p) => {
    const canvas = canvasRef.current
    const viewport = viewportRef.current
    if (!canvas || !viewport) return
    let r: DOMRect | null = null
    let v: DOMRect | null = null

    items.forEach(({ timing }, i) => {
      const dot = dots.current[i]
      const tag = tags.current[i]
      const line = lines.current[i]
      const anchor = timing.anchor
      if (!dot || !tag || !line || !anchor) return
      const a = chapterAlpha(p, timing)
      const hidden = a < 0.01
      for (const el of [dot, tag, line]) {
        el.style.opacity = hidden ? '0' : a.toFixed(3)
        el.style.visibility = hidden ? 'hidden' : 'visible'
      }
      if (hidden) return

      // Measured only for a chapter that is on screen, and once per frame.
      r ??= canvas.getBoundingClientRect()
      v ??= viewport.getBoundingClientRect()
      const ax = r.left - v.left + anchor.x * r.width
      const ay = r.top - v.top + anchor.y * r.height
      // Kept inside the viewport.
      const w = tag.offsetWidth
      const end = anchor.dx < 0
      const rawX = ax + anchor.dx * r.width
      const tx = end ? Math.max(rawX, w + 16) : Math.min(rawX, v.width - w - 24)
      const ty = Math.max(ay + anchor.dy * r.height, 96)
      // The line draws itself out from the part as the chapter arrives.
      const drawn = Math.min(1, a * 1.4)
      dot.style.transform = `translate3d(${ax.toFixed(1)}px, ${ay.toFixed(1)}px, 0)`
      tag.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0)`
      tag.dataset.align = end ? 'end' : 'start'
      line.setAttribute('x1', ax.toFixed(1))
      line.setAttribute('y1', ay.toFixed(1))
      line.setAttribute('x2', (ax + (tx - ax) * drawn).toFixed(1))
      line.setAttribute('y2', (ay + (ty - ay) * drawn).toFixed(1))
    })
  })

  return (
    <div className="assembly__callouts" aria-hidden="true">
      <svg className="assembly__lines">
        {items.map(({ timing }, i) => (
          <line
            key={timing.id}
            ref={(el) => {
              lines.current[i] = el
            }}
          />
        ))}
      </svg>
      {items.map(({ timing, tag }, i) => (
        <span key={timing.id}>
          <span
            className="assembly__dot"
            ref={(el) => {
              dots.current[i] = el
            }}
          />
          <span
            className="assembly__tag"
            ref={(el) => {
              tags.current[i] = el
            }}
          >
            <span className="assembly__tag-inner">{tag}</span>
          </span>
        </span>
      ))}
    </div>
  )
}

/* Pagination dots ----------------------------------------------------------- */
function Dots({ onSeek }: { onSeek: (c: StudioChapter) => void }) {
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
    <nav className="assembly__dots" ref={navRef} aria-label={t.hero.progressLabel}>
      <ol ref={listRef}>
        {CHAPTERS.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onSeek(c)}
              aria-label={t.hero.chapters.find((x) => x.id === c.id)?.nav}
            >
              <span />
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}

/** The round corner badge: circular text that turns with the scroll. */
function Badge() {
  const { t } = useLanguage()
  const ringRef = useRef<SVGGElement>(null)
  const badgeRef = useRef<HTMLDivElement>(null)
  useProgressEffect((p) => {
    ringRef.current?.setAttribute('transform', `rotate(${(p * 540).toFixed(2)} 50 50)`)
    // It shares the bottom-right corner with the intro's buttons, so it
    // arrives with the dots, once the intro has gone.
    if (badgeRef.current) badgeRef.current.dataset.show = p > INTRO.exit * 0.6 ? 'true' : 'false'
  })
  const text = `${t.hero.scroll} · ${t.hero.eyebrow} · `
  return (
    <div className="assembly__badge" ref={badgeRef} aria-hidden="true">
      <svg viewBox="0 0 100 100">
        <defs>
          <path id="badge-circle" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
        </defs>
        <g ref={ringRef}>
          <text>
            <textPath href="#badge-circle" textLength="238">
              {text.toUpperCase()}
            </textPath>
          </text>
        </g>
      </svg>
      <ArrowDown className="assembly__badge-arrow" />
    </div>
  )
}

function useMobileRef() {
  const ref = useRef(window.matchMedia(MOBILE_QUERY).matches)
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY)
    const onChange = (e: MediaQueryListEvent) => {
      ref.current = e.matches
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return ref
}
