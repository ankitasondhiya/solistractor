import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import './model-gallery.css'

import { useStoreEffect } from '../../hooks/progressStore'
import { progressTop } from '../../hooks/useScrollProgress'
import { usePinnedProgress } from '../../hooks/usePinnedProgress'
import { useLanguage } from '../../i18n/LanguageContext'
import { useMotion } from '../../motion/MotionContext'
import { MAX_HP, formatPrice, modelBadge, models, segmentRange, segments, type Segment } from '../../data/models'
import { imageIn, openModelSheet } from '../ModelSheet/sheetBus'
import { ArrowLeft, ArrowRight, Check } from '../../components/Icons'
import { useMatchIds } from '../../personal/personal'
import { RollingNumber } from '../../components/RollingNumber'
import { ShortlistToggle } from '../../components/Shortlist/ShortlistToggle'

/** Phones (and reduced motion) turn the ring by hand; desktops by scrolling. */
const FREE_QUERY = '(max-width: 899px)'
const N = models.length
const LAST = N - 1
/** The angle between two neighbours on the ring: 30° for twelve cards. */
const STEP = (2 * Math.PI) / N
/** How far a pointer must travel sideways before it counts as a drag. */
const DRAG_THRESHOLD = 8

const wrap = (i: number) => ((Math.round(i) % N) + N) % N

/** Signed distance from `from` to card `to` the short way round, in cards (−N/2..N/2]. */
function ringDelta(from: number, to: number): number {
  let d = (to - from) % N
  if (d > N / 2) d -= N
  if (d <= -N / 2) d += N
  return d
}

/**
 * Makes the ring dwell on each tractor while scrolling: progress between two
 * cards is reshaped so the middle of the turn is quick and the ends slow, and
 * a card rests at the front for a moment before the next one comes round.
 */
function dwell(position: number): number {
  const base = Math.floor(position)
  const t = position - base
  const shaped = t < 0.5 ? 0.5 * Math.pow(2 * t, 2.4) : 1 - 0.5 * Math.pow(2 * (1 - t), 2.4)
  return base + shaped
}

/** The inverse of dwell(), so a drag can be turned back into a scroll position. */
function undwell(position: number): number {
  const base = Math.floor(position)
  const s = position - base
  const t = s < 0.5 ? 0.5 * Math.pow(2 * s, 1 / 2.4) : 1 - 0.5 * Math.pow(2 * (1 - s), 1 / 2.4)
  return base + t
}

/**
 * A spec as published, split around its first figure so the figure can roll:
 * "2.500 kg (3.000 kg optie)" → 2500 + " kg (3.000 kg optie)".
 */
function splitFigure(text: string, lang: 'nl' | 'en'): { n: number; decimals: number; rest: string } | null {
  const re = lang === 'nl' ? /^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d+))?(.*)$/s : /^(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?(.*)$/s
  const m = re.exec(text)
  if (!m) return null
  const whole = m[1]!.replace(/[.,]/g, '')
  const decimals = m[2]?.length ?? 0
  return { n: Number(decimals ? `${whole}.${m[2]}` : whole), decimals, rest: m[3] ?? '' }
}

/** A published spec whose leading figure rolls to its new value. */
function RollingSpec({ text, lang }: { text: string; lang: 'nl' | 'en' }) {
  const parts = splitFigure(text, lang)
  if (!parts) return <>{text}</>
  const locale = lang === 'nl' ? 'nl-NL' : 'en-GB'
  return (
    <RollingNumber
      value={parts.n}
      format={(n) =>
        n.toLocaleString(locale, { minimumFractionDigits: parts.decimals, maximumFractionDigits: parts.decimals }) +
        parts.rest
      }
    />
  )
}

/** Half the ring's width on screen: wider on phones so the neighbours peek out. */
function ringRadius(stageWidth: number, cardWidth: number): number {
  return stageWidth < 600 ? stageWidth * 0.52 : Math.min(stageWidth * 0.4, cardWidth * 1.7)
}

interface Drag {
  id: number
  x: number
  y: number
  start: number
  moved: boolean
  lastX: number
  lastT: number
  /** px per ms, for the fling on release */
  v: number
}

/**
 * Section 03 — all twelve tractors on a ring that turns.
 *
 * The cards stand around a circle, 30° apart, seen slightly from above: the
 * one at the front faces the reader at full size, its neighbours turn away
 * along the curve, and the far side of the ring shows smaller and dimmer
 * above them — so the whole range is in view at once. It is CSS 3D, not
 * WebGL: every card stays a real, sharp, focusable button.
 *
 * Desktop: the section pins and scrolling turns the ring (dragging works
 * too). Phones and reduced motion: the section scrolls normally and the ring
 * is turned by swiping, the arrows or the segment chips, and wraps round
 * endlessly. Clicking a card brings it to the front; clicking the front card
 * opens its full sheet.
 */
export function ModelGallery() {
  const { t, l, lang } = useLanguage()
  const { scrollTo, systemReduced, calm } = useMotion()
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [free, setFree] = useState(() => window.matchMedia(FREE_QUERY).matches || systemReduced)
  const [active, setActive] = useState(0)
  const [dragging, setDragging] = useState(false)
  const activeRef = useRef(0)
  const posRef = useRef(0)
  const targetRef = useRef(0)
  const rafRef = useRef(0)
  const dragRef = useRef<Drag | null>(null)
  const suppressClick = useRef(false)
  const pressedActive = useRef(false)
  const matches = useMatchIds()
  const hintId = useId()

  useEffect(() => {
    const mq = window.matchMedia(FREE_QUERY)
    const update = () => setFree(mq.matches || systemReduced)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [systemReduced])

  const store = usePinnedProgress(sectionRef, !free)

  const select = useCallback((index: number) => {
    if (index === activeRef.current) return
    activeRef.current = index
    setActive(index)
  }, [])

  /** Places every card on the ring for a (fractional) position, in cards. */
  const render = useCallback(
    (position: number) => {
      posRef.current = position
      const stage = stageRef.current
      const first = cardRefs.current[0]
      if (!stage || !first) return
      const w = first.offsetWidth
      const h = first.offsetHeight
      // Half the ring's width on screen, and how far the far side rises.
      const rx = ringRadius(stage.clientWidth, w)
      const lift = h * 0.62
      cardRefs.current.forEach((card, i) => {
        if (!card) return
        const d = ringDelta(position, i)
        const a = d * STEP
        const depth = (1 - Math.cos(a)) / 2 // 0 at the front … 1 at the back
        const x = Math.sin(a) * rx
        const y = (0.3 - depth) * lift
        const scale = 1 - depth * 0.42
        // Cards turn with the curve at the sides and face the reader again at the back.
        const turn = Math.sin(a) * 34
        card.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) perspective(1400px) rotateY(${turn.toFixed(2)}deg) scale(${scale.toFixed(3)})`
        card.style.opacity = (1 - depth * 0.58).toFixed(3)
        card.style.zIndex = String(Math.round((1 - depth) * 100))
        card.dataset.active = Math.abs(d) < 0.5 ? 'true' : 'false'
        card.dataset.far = depth > 0.3 ? 'true' : 'false'
      })
      select(wrap(position))
    },
    [select],
  )

  // Desktop: the scroll position turns the ring.
  useStoreEffect(store, (p) => {
    if (!free) render(dwell(p * LAST))
  })

  // First paint, mode changes and resizes all re-place the cards.
  useEffect(() => {
    if (free) targetRef.current = posRef.current
    render(posRef.current)
    const onResize = () => render(posRef.current)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [free, render])

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  /** Phones: ease toward the target; instant when motion is paused or reduced. */
  const animate = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    const tick = () => {
      const target = targetRef.current
      const current = posRef.current
      const next = calm ? target : current + (target - current) * 0.14
      if (Math.abs(target - next) < 0.002) {
        render(target)
        return
      }
      render(next)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [calm, render])

  /** Turns the ring to a position — by scrolling (desktop) or directly (phones). */
  const turnTo = useCallback(
    (position: number, immediate = false) => {
      if (!free) {
        const clamped = Math.min(LAST, Math.max(0, position))
        const top = progressTop(sectionRef, undwell(clamped) / LAST)
        if (top !== null) scrollTo(top, { immediate })
        return
      }
      targetRef.current = position
      if (immediate) {
        cancelAnimationFrame(rafRef.current)
        render(position)
      } else animate()
    },
    [free, scrollTo, render, animate],
  )

  /** Brings card `index` to the front, the short way round. */
  const goTo = useCallback(
    (index: number) => {
      if (!free) {
        turnTo(Math.min(LAST, Math.max(0, index)))
        return
      }
      const from = targetRef.current
      turnTo(from + ringDelta(from, index))
    },
    [free, turnTo],
  )

  const step = useCallback(
    (dir: 1 | -1) => {
      if (!free) goTo(activeRef.current + dir)
      else turnTo(Math.round(targetRef.current) + dir)
    },
    [free, goTo, turnTo],
  )

  /* Dragging ----------------------------------------------------------------
     Sideways only, after a small threshold, so a vertical swipe still scrolls
     the page (touch-action: pan-y) and a click is still a click. */
  const spacing = () => {
    const stage = stageRef.current
    const first = cardRefs.current[0]
    if (!stage || !first) return 200
    return ringRadius(stage.clientWidth, first.offsetWidth) * Math.sin(STEP)
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    dragRef.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      start: posRef.current,
      moved: false,
      lastX: e.clientX,
      lastT: e.timeStamp,
      v: 0,
    }
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.id !== e.pointerId) return
    const dx = e.clientX - drag.x
    const dy = e.clientY - drag.y
    if (!drag.moved) {
      if (Math.abs(dy) > DRAG_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
        dragRef.current = null // a vertical swipe: leave it to the page
        return
      }
      if (Math.abs(dx) < DRAG_THRESHOLD) return
      drag.moved = true
      setDragging(true)
      cancelAnimationFrame(rafRef.current)
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    const dt = e.timeStamp - drag.lastT
    if (dt > 0) drag.v = (e.clientX - drag.lastX) / dt
    drag.lastX = e.clientX
    drag.lastT = e.timeStamp
    turnTo(drag.start - dx / spacing(), true)
  }

  const onPointerEnd = (e: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.id !== e.pointerId) return
    dragRef.current = null
    if (!drag.moved) return
    setDragging(false)
    suppressClick.current = true
    window.setTimeout(() => {
      suppressClick.current = false
    }, 0)
    // A quick flick carries on a little, then settles on the nearest card.
    const fling = (-drag.v * 220) / spacing()
    const settle = Math.round(posRef.current + Math.max(-3, Math.min(3, fling)))
    if (free) turnTo(settle)
    else goTo(settle)
  }

  const onCardKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const dir = e.key === 'ArrowRight' ? 1 : -1
    const next = free ? wrap(activeRef.current + dir) : Math.min(LAST, Math.max(0, activeRef.current + dir))
    goTo(next)
    cardRefs.current[next]?.focus({ preventScroll: true })
  }

  const model = models[active] ?? models[0]!
  const firstOf = (segment: Segment) => models.findIndex((m) => m.segment === segment)
  const atStart = !free && active === 0
  const atEnd = !free && active === LAST

  return (
    <section
      className="gallery"
      id="modellen"
      ref={sectionRef}
      data-mode={free ? 'free' : 'pinned'}
      aria-labelledby="gallery-title"
    >
      <div className="gallery__viewport">
        <div className="container gallery__head">
          <div>
            <p className="eyebrow">{t.models.eyebrow}</p>
            <h2 id="gallery-title" className="display display--md">
              {t.models.title.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h2>
          </div>
          <div className="gallery__controls">
            <div className="gallery__chips" role="group" aria-label={t.models.all}>
              {segments.map((segment) => (
                <button
                  key={segment}
                  type="button"
                  className="chip"
                  aria-pressed={model.segment === segment}
                  onClick={() => goTo(firstOf(segment))}
                >
                  {t.models.segments[segment]}
                  <span className="chip__note">{segmentRange(segment, lang)}</span>
                </button>
              ))}
            </div>
            <div className="gallery__nav">
              <button
                type="button"
                className="round-btn"
                aria-label={t.models.previous}
                disabled={atStart}
                onClick={() => step(-1)}
              >
                <ArrowLeft />
              </button>
              <span className="gallery__count" aria-live="polite">
                {String(active + 1).padStart(2, '0')} <span>/ {String(N).padStart(2, '0')}</span>
              </span>
              <button type="button" className="round-btn" aria-label={t.models.next} disabled={atEnd} onClick={() => step(1)}>
                <ArrowRight />
              </button>
            </div>
          </div>
        </div>

        <div
          className="gallery__stage"
          ref={stageRef}
          role="group"
          aria-roledescription="carousel"
          aria-label={t.models.ring}
          aria-describedby={hintId}
          data-dragging={dragging ? 'true' : 'false'}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        >
          <p id={hintId} className="visually-hidden">
            {t.models.ringHint}
          </p>
          <div className="gallery__ring">
            {models.map((m, i) => {
              const isMatch = matches.includes(m.id)
              const isActive = i === active
              return (
                <button
                  key={m.id}
                  type="button"
                  className="gallery__card"
                  data-active={isActive ? 'true' : 'false'}
                  aria-label={`Solis ${m.fullName}, ${modelBadge(m, lang)}${isMatch ? `, ${t.personal.match}` : ''}${isActive ? `. ${t.sheet.open}` : ''}`}
                  aria-current={isActive}
                  // One card in the Tab order (the front one); the arrow keys move round the ring.
                  tabIndex={isActive ? 0 : -1}
                  ref={(el) => {
                    cardRefs.current[i] = el
                  }}
                  onPointerDown={() => {
                    pressedActive.current = activeRef.current === i
                  }}
                  onFocus={(e) => {
                    // Tabbing to a card brings it round to the front, so focus is never hidden behind another.
                    if (e.currentTarget.matches(':focus-visible') && activeRef.current !== i) goTo(i)
                  }}
                  onKeyDown={onCardKeyDown}
                  onClick={(e) => {
                    if (suppressClick.current) return
                    // Keyboard clicks (detail 0) are judged now; pointer clicks by where the card was when pressed.
                    const wasFront = e.detail === 0 ? activeRef.current === i : pressedActive.current
                    if (wasFront) openModelSheet(m.id, 'overview', imageIn(e.currentTarget))
                    else goTo(i)
                  }}
                >
                  <span className="gallery__card-name" aria-hidden="true">
                    {m.name.replace(' Shuttle XL', '')}
                  </span>
                  <span className="gallery__card-badges">
                    <span className="model-badge">{modelBadge(m, lang)}</span>
                    {isMatch && (
                      <span className="match-badge">
                        <Check aria-hidden="true" />
                        {t.personal.match}
                      </span>
                    )}
                  </span>
                  <img
                    src={m.image}
                    alt=""
                    width={1024}
                    height={725}
                    loading={i < 3 || i > N - 3 ? 'eager' : 'lazy'}
                    decoding="async"
                    draggable={false}
                  />
                  <span className="gallery__card-meta">
                    <span>{t.models.segments[m.segment]}</span>
                    <span>4WD</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="container gallery__detail">
          <div className="gallery__detail-main" key={model.id}>
            <p className="gallery__detail-kicker">
              <span className="model-badge">{modelBadge(model, lang)}</span>
              {t.models.segments[model.segment]}
            </p>
            <h3 className="display gallery__detail-name">{model.fullName}</h3>
            <p className="gallery__detail-pitch">{l(model.pitch)}</p>
          </div>

          <dl className="gallery__specs">
            <div>
              <dt>{t.models.specs.engine}</dt>
              <dd className="gallery__swap" key={`engine-${model.id}`}>
                {l(model.engine)}
              </dd>
            </div>
            <div>
              <dt>{t.models.specs.lift}</dt>
              <dd>
                <RollingSpec text={l(model.lift)} lang={lang} />
              </dd>
            </div>
            <div>
              <dt>{t.models.specs.transmission}</dt>
              <dd className="gallery__swap" key={`tx-${model.id}`}>
                {l(model.transmission)}
              </dd>
            </div>
            <div>
              <dt>{t.models.specs.pto}</dt>
              <dd className="gallery__swap" key={`pto-${model.id}`}>
                {l(model.pto)}
              </dd>
            </div>
            {model.width && (
              <div>
                <dt>{t.models.specs.width}</dt>
                <dd>
                  <RollingSpec text={l(model.width)} lang={lang} />
                </dd>
              </div>
            )}
            <div className="gallery__power">
              <dt>{t.models.power}</dt>
              <dd>
                <span className="gallery__power-bar">
                  <span style={{ transform: `scaleX(${model.hp / MAX_HP})` }} />
                </span>
                <span className="gallery__hp">
                  <RollingNumber value={model.hp} format={(n) => `${Math.round(n)} ${lang === 'nl' ? 'pk' : 'hp'}`} />
                </span>
              </dd>
            </div>
          </dl>

          <div className="gallery__buy">
            <p className="gallery__price-label">{t.models.from}</p>
            <p className="gallery__price">
              <RollingNumber value={model.price} format={(n) => formatPrice(Math.round(n), lang)} />
              <small>{t.models.vat}</small>
            </p>
            <div className="gallery__buy-actions">
              <button
                type="button"
                className="btn"
                onClick={() => openModelSheet(model.id, 'overview', imageIn(cardRefs.current[active]))}
              >
                {t.sheet.open}
                <ArrowRight className="btn__icon" />
              </button>
              <ShortlistToggle modelId={model.id} labelled />
            </div>
            <a
              className="text-link"
              href="#vergelijken"
              onClick={(e) => {
                e.preventDefault()
                scrollTo('#vergelijken', { offset: -24 })
              }}
            >
              {t.models.compareAll}
              <ArrowRight />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
