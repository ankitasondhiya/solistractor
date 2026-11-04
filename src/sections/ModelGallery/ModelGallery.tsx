import { useCallback, useEffect, useRef, useState } from 'react'
import './model-gallery.css'

import { useStoreEffect } from '../../hooks/progressStore'
import { progressTop } from '../../hooks/useScrollProgress'
import { usePinnedProgress } from '../../hooks/usePinnedProgress'
import { useLanguage } from '../../i18n/LanguageContext'
import { useMotion } from '../../motion/MotionContext'
import { MAX_HP, formatPrice, modelBadge, models, segmentRange, segments, type Segment } from '../../data/models'
import { openModelSheet } from '../ModelSheet/sheetBus'
import { ArrowLeft, ArrowRight, Check } from '../../components/Icons'
import { useMatchIds } from '../../personal/personal'

const SWIPE_QUERY = '(max-width: 899px)'
const LAST = models.length - 1

/**
 * Makes the gallery dwell on each tractor: progress between two cards is
 * reshaped so the middle of the move is quick and the ends are slow, and a
 * card sits centred for a moment before the next one comes round.
 */
function dwell(position: number): number {
  const base = Math.floor(position)
  const t = position - base
  const shaped = t < 0.5 ? 0.5 * Math.pow(2 * t, 2.4) : 1 - 0.5 * Math.pow(2 * (1 - t), 2.4)
  return base + shaped
}

/**
 * Section 03 — all twelve tractors on a curved rail.
 *
 * On a desktop the section pins and vertical scroll turns the rail: the card
 * in the middle faces the reader and the rest wrap away in perspective (after
 * Ascenta Studio's work gallery). On a phone the same rail is a plain swipe
 * carousel — pinning a touch screen to move sideways fights the thumb.
 */
export function ModelGallery() {
  const { t, l, lang } = useLanguage()
  const { scrollTo, systemReduced } = useMotion()
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [swipe, setSwipe] = useState(() => window.matchMedia(SWIPE_QUERY).matches || systemReduced)
  const [active, setActive] = useState(0)
  const activeRef = useRef(0)
  const matches = useMatchIds()

  useEffect(() => {
    const mq = window.matchMedia(SWIPE_QUERY)
    const update = () => setSwipe(mq.matches || systemReduced)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [systemReduced])

  const store = usePinnedProgress(sectionRef, !swipe)

  const select = useCallback((index: number) => {
    if (index === activeRef.current) return
    activeRef.current = index
    setActive(index)
  }, [])

  // Pinned rail: position every card for the current scroll.
  useStoreEffect(store, (p) => {
    if (swipe) return
    const track = trackRef.current
    const first = cardRefs.current[0]
    if (!track || !first) return
    const position = dwell(p * LAST)
    const step = first.offsetWidth + parseFloat(getComputedStyle(track).columnGap || '0')
    track.style.transform = `translate3d(${(-position * step).toFixed(1)}px, 0, 0)`
    cardRefs.current.forEach((card, i) => {
      if (!card) return
      const d = i - position
      const ad = Math.abs(d)
      const rot = Math.max(-58, Math.min(58, d * -24))
      card.style.transform = `translateZ(${(-ad * 90).toFixed(1)}px) rotateY(${rot.toFixed(2)}deg) scale(${(1 - Math.min(ad, 3) * 0.05).toFixed(3)})`
      card.style.opacity = (1 - Math.min(ad, 3.2) * 0.24).toFixed(3)
      card.dataset.active = ad < 0.5 ? 'true' : 'false'
    })
    select(Math.round(position))
  })

  // Swipe rail: the card nearest the centre is the active one.
  useEffect(() => {
    const track = trackRef.current
    if (!swipe || !track) return undefined
    track.style.transform = ''
    cardRefs.current.forEach((card) => {
      if (card) {
        card.style.transform = ''
        card.style.opacity = ''
      }
    })
    const onScroll = () => {
      const first = cardRefs.current[0]
      if (!first) return
      const step = first.offsetWidth + parseFloat(getComputedStyle(track).columnGap || '0')
      select(Math.min(LAST, Math.max(0, Math.round(track.scrollLeft / step))))
    }
    track.addEventListener('scroll', onScroll, { passive: true })
    return () => track.removeEventListener('scroll', onScroll)
  }, [swipe, select])

  const goTo = useCallback(
    (index: number) => {
      const i = Math.min(LAST, Math.max(0, index))
      if (swipe) {
        const card = cardRefs.current[i]
        card?.scrollIntoView({ behavior: systemReduced ? 'auto' : 'smooth', block: 'nearest', inline: 'center' })
        select(i)
        return
      }
      const top = progressTop(sectionRef, i / LAST)
      if (top !== null) scrollTo(top)
    },
    [swipe, scrollTo, select, systemReduced],
  )

  const model = models[active] ?? models[0]!
  const firstOf = (segment: Segment) => models.findIndex((m) => m.segment === segment)

  return (
    <section
      className="gallery"
      id="modellen"
      ref={sectionRef}
      data-mode={swipe ? 'swipe' : 'pinned'}
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
                disabled={active === 0}
                onClick={() => goTo(active - 1)}
              >
                <ArrowLeft />
              </button>
              <span className="gallery__count" aria-live="polite">
                {String(active + 1).padStart(2, '0')} <span>/ {String(models.length).padStart(2, '0')}</span>
              </span>
              <button
                type="button"
                className="round-btn"
                aria-label={t.models.next}
                disabled={active === LAST}
                onClick={() => goTo(active + 1)}
              >
                <ArrowRight />
              </button>
            </div>
          </div>
        </div>

        <div className="gallery__stage">
          <div className="gallery__track" ref={trackRef}>
            {models.map((m, i) => (
              <button
                key={m.id}
                type="button"
                className="gallery__card"
                data-active={i === active ? 'true' : 'false'}
                aria-label={`Solis ${m.fullName}, ${modelBadge(m, lang)}${matches.includes(m.id) ? `, ${t.personal.match}` : ''}`}
                aria-current={i === active}
                ref={(el) => {
                  cardRefs.current[i] = el
                }}
                onClick={() => goTo(i)}
              >
                <span className="gallery__card-name" aria-hidden="true">
                  {m.name.replace(' Shuttle XL', '')}
                </span>
                <span className="gallery__card-badges">
                  <span className="model-badge">{modelBadge(m, lang)}</span>
                  {matches.includes(m.id) && (
                    <span className="match-badge">
                      <Check aria-hidden="true" />
                      {t.personal.match}
                    </span>
                  )}
                </span>
                <img src={m.image} alt="" width={1024} height={725} loading={i < 3 ? 'eager' : 'lazy'} decoding="async" />
                <span className="gallery__card-meta">
                  <span>{t.models.segments[m.segment]}</span>
                  <span>4WD</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="container gallery__detail" key={model.id}>
          <div className="gallery__detail-main">
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
              <dd>{l(model.engine)}</dd>
            </div>
            <div>
              <dt>{t.models.specs.lift}</dt>
              <dd>{l(model.lift)}</dd>
            </div>
            <div>
              <dt>{t.models.specs.transmission}</dt>
              <dd>{l(model.transmission)}</dd>
            </div>
            <div>
              <dt>{t.models.specs.pto}</dt>
              <dd>{l(model.pto)}</dd>
            </div>
            {model.width && (
              <div>
                <dt>{t.models.specs.width}</dt>
                <dd>{l(model.width)}</dd>
              </div>
            )}
            <div className="gallery__power">
              <dt>{t.models.power}</dt>
              <dd>
                <span className="gallery__power-bar">
                  <span style={{ width: `${(model.hp / MAX_HP) * 100}%` }} />
                </span>
                {model.hp} {lang === 'nl' ? 'pk' : 'hp'}
              </dd>
            </div>
          </dl>

          <div className="gallery__buy">
            <p className="gallery__price-label">{t.models.from}</p>
            <p className="gallery__price">
              {formatPrice(model.price, lang)}
              <small>{t.models.vat}</small>
            </p>
            <button type="button" className="btn" onClick={() => openModelSheet(model.id)}>
              {t.sheet.open}
              <ArrowRight className="btn__icon" />
            </button>
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
