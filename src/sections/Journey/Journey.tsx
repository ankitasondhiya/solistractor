import { useRef } from 'react'
import './journey.css'

import { useStoreEffect } from '../../hooks/progressStore'
import { usePinnedProgress } from '../../hooks/usePinnedProgress'
import { chapterAlpha } from '../../data/timeline'
import { useLanguage } from '../../i18n/LanguageContext'
import { useMotion } from '../../motion/MotionContext'
import { links, media } from '../../data/links'
import { EDITION } from '../../edition'
import { ArrowRight } from '../../components/Icons'

/** [enter, hold, release, exit] per panel: the story first, then the three steps. */
const WINDOWS = [
  { enter: -1, hold: -0.5, release: 0.2, exit: 0.28 },
  { enter: 0.3, hold: 0.36, release: 0.47, exit: 0.53 },
  { enter: 0.55, hold: 0.61, release: 0.72, exit: 0.78 },
  { enter: 0.8, hold: 0.86, release: 1.1, exit: 1.2 },
]

/**
 * Section 06 — one photograph, held while the copy changes over it (after
 * Enki's Web Studio's "Understand / Design / Build"). First who makes Solis,
 * then the three steps from choosing a tractor to driving it.
 */
export function Journey() {
  const { t } = useLanguage()
  const { systemReduced } = useMotion()
  const sectionRef = useRef<HTMLElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const panelRefs = useRef<(HTMLDivElement | null)[]>([])
  const stepRef = useRef<HTMLSpanElement>(null)
  const barRef = useRef<HTMLSpanElement>(null)
  const store = usePinnedProgress(sectionRef, !systemReduced)

  useStoreEffect(store, (p) => {
    if (imageRef.current) {
      imageRef.current.style.transform = `scale(${(1.14 - p * 0.14).toFixed(4)}) translate3d(0, ${(p * -2).toFixed(2)}%, 0)`
    }
    WINDOWS.forEach((w, i) => {
      const el = panelRefs.current[i]
      if (!el) return
      const a = chapterAlpha(p, w)
      el.style.setProperty('--a', a.toFixed(3))
      el.style.visibility = a < 0.01 ? 'hidden' : 'visible'
    })
    const step = p < 0.3 ? 0 : p < 0.54 ? 1 : p < 0.79 ? 2 : 3
    if (stepRef.current) stepRef.current.textContent = step === 0 ? '—' : String(step).padStart(2, '0')
    if (barRef.current) barRef.current.style.transform = `scaleX(${Math.max(0, (p - 0.28) / 0.6).toFixed(4)})`
  })

  return (
    <section
      className="journey"
      id="verhaal"
      ref={sectionRef}
      data-static={systemReduced ? 'true' : 'false'}
      aria-labelledby="journey-title"
    >
      <div className="journey__viewport">
        <figure className="journey__media">
          <img ref={imageRef} src={EDITION === 'film' ? '/media/film/tractor-field.webp' : media.farmyard} alt={t.journey.caption} loading="lazy" />
        </figure>

        <div className="container journey__panels">
          <div
            className="journey__panel journey__panel--story"
            ref={(el) => {
              panelRefs.current[0] = el
            }}
          >
            <p className="eyebrow eyebrow--light">{t.journey.eyebrow}</p>
            <h2 id="journey-title" className="display display--lg">
              {t.journey.title.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h2>
            <p className="journey__body">{t.journey.body}</p>
            <dl className="journey__facts">
              {t.journey.facts.map((fact) => (
                <div key={fact.title}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.title}</dd>
                </div>
              ))}
            </dl>
            <div className="journey__actions">
              <a className="btn btn--ghost-light" href={links.about}>
                {t.journey.cta}
                <ArrowRight className="btn__icon" />
              </a>
              <a className="journey__history" href={links.history}>
                {t.journey.history}
                <ArrowRight aria-hidden="true" />
              </a>
            </div>
          </div>

          {t.journey.steps.map((step, i) => (
            <div
              key={step.title}
              className="journey__panel journey__panel--step"
              data-side={i % 2 === 0 ? 'left' : 'right'}
              ref={(el) => {
                panelRefs.current[i + 1] = el
              }}
            >
              <p className="journey__step-word display">{step.title}</p>
              <p className="journey__step-body">
                <span>{String(i + 1).padStart(2, '0')}</span>
                {step.body}
              </p>
            </div>
          ))}
        </div>

        <div className="container journey__progress" aria-hidden="true">
          <span className="journey__progress-label">{t.journey.stepsLabel}</span>
          <span className="journey__progress-bar">
            <span ref={barRef} />
          </span>
          <span className="journey__progress-count">
            <span ref={stepRef}>—</span> / 03
          </span>
        </div>
      </div>
    </section>
  )
}
