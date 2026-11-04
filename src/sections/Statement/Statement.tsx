import { useMemo, useRef } from 'react'
import './statement.css'

import { useStoreEffect } from '../../hooks/progressStore'
import { easeOut, usePinnedProgress } from '../../hooks/usePinnedProgress'
import { useLanguage } from '../../i18n/LanguageContext'
import { useMotion } from '../../motion/MotionContext'

/** Where each word starts: deterministic, so the scatter is the same every visit. */
function scatter(i: number) {
  const r = (n: number) => {
    const s = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453
    return s - Math.floor(s)
  }
  return {
    x: (r(1) - 0.5) * 80, // vw
    y: (r(2) - 0.5) * 70, // vh
    rot: (r(3) - 0.5) * 60, // deg
    scale: 0.55 + r(4) * 1.1,
    delay: r(5) * 0.28,
  }
}

/**
 * The brand statement, assembled the way the tractor was: its words start
 * strewn across the screen and fly into a sentence as the reader scrolls
 * (after Enki's Web Studio). Then the range's four numbers count up beneath it.
 */
export function Statement() {
  const { t } = useLanguage()
  const { systemReduced } = useMotion()
  const sectionRef = useRef<HTMLElement>(null)
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([])
  const metaRef = useRef<HTMLDivElement>(null)
  const statRefs = useRef<(HTMLSpanElement | null)[]>([])
  const store = usePinnedProgress(sectionRef, !systemReduced)

  const words = useMemo(() => t.statement.text.split(' '), [t.statement.text])
  const seeds = useMemo(() => words.map((_, i) => scatter(i)), [words])

  useStoreEffect(store, (p) => {
    // Words: assembled over the first 70% of the pin.
    wordRefs.current.forEach((el, i) => {
      const seed = seeds[i]
      if (!el || !seed) return
      const k = 1 - easeOut((p - seed.delay * 0.7) / 0.42)
      if (k < 0.001) {
        el.style.transform = 'none'
        el.style.opacity = '1'
        el.style.filter = 'none'
        return
      }
      el.style.transform = `translate3d(${(seed.x * k).toFixed(2)}vw, ${(seed.y * k).toFixed(2)}vh, 0) rotate(${(seed.rot * k).toFixed(1)}deg) scale(${(1 + (seed.scale - 1) * k).toFixed(3)})`
      el.style.opacity = (1 - k * 0.8).toFixed(3)
      el.style.filter = k > 0.04 ? `blur(${(k * 6).toFixed(1)}px)` : 'none'
    })

    // Numbers: count up once the sentence has formed.
    const a = easeOut((p - 0.62) / 0.25)
    metaRef.current?.style.setProperty('--a', a.toFixed(3))
    t.why.stats.forEach((stat, i) => {
      const el = statRefs.current[i]
      if (el) el.textContent = String(Math.round(stat.value * a))
    })
  })

  return (
    <section className="statement" ref={sectionRef} id="waarom" data-static={systemReduced ? 'true' : 'false'}>
      <div className="statement__viewport">
        <div className="container statement__inner">
          <p className="eyebrow">{t.statement.eyebrow}</p>
          <p className="statement__text">
            {words.map((word, i) => (
              <span
                key={`${word}-${i}`}
                className="statement__word"
                ref={(el) => {
                  wordRefs.current[i] = el
                }}
              >
                {word}
              </span>
            ))}
          </p>

          <div className="statement__meta" ref={metaRef}>
            <p className="statement__aside">{t.statement.aside}</p>
            <dl className="statement__stats">
              {t.why.stats.map((stat, i) => (
                <div key={stat.label} className="statement__stat">
                  <dt>{stat.label}</dt>
                  <dd>
                    {stat.prefix}
                    <span
                      ref={(el) => {
                        statRefs.current[i] = el
                      }}
                    >
                      {systemReduced ? stat.value : 0}
                    </span>
                    {stat.suffix}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  )
}
