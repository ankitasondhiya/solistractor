import { useEffect, useRef, useState } from 'react'
import './preloader.css'

import { useLanguage } from '../../i18n/LanguageContext'
import { useMotion } from '../../motion/MotionContext'
import { preload } from '../../motion/preload'
import { SolisLogo } from '../Icons'

/** Never hold the page longer than this, whatever the network is doing. */
const MAX_WAIT = 6000

/**
 * The curtain over the page while the hero's first frames arrive.
 *
 * The counter and the letter fill both read `preload`, which the hero feeds
 * with the share of its opening frames that have loaded — so the number means
 * something. The displayed value eases toward the real one, so a fast
 * connection still shows a counted-up number rather than a flash.
 */
export function Preloader() {
  const { t } = useLanguage()
  const { lockScroll, systemReduced } = useMotion()
  const [phase, setPhase] = useState<'loading' | 'leaving' | 'gone'>('loading')
  const rootRef = useRef<HTMLDivElement>(null)
  const countRef = useRef<HTMLSpanElement>(null)
  const lettersRef = useRef<HTMLSpanElement[]>([])

  const lines = t.preloader.line

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    lockScroll(true)

    let minTime = systemReduced ? 300 : 1300
    const start = performance.now()
    let target = 0
    let skipped = false
    let shown = 0
    let frame = 0
    let leaveTimer = 0
    let done = false

    const unsubscribe = preload.subscribe((v) => {
      target = v
    })
    const cap = window.setTimeout(() => {
      target = 1
    }, MAX_WAIT)

    // The curtain never holds a reader who wants in: any key, click, tap or
    // wheel lifts it at once. The film draws its nearest loaded frame, so
    // what is behind is already usable.
    const skip = () => {
      skipped = true
      minTime = 0
    }
    const SKIP_EVENTS = ['keydown', 'pointerdown', 'wheel', 'touchstart'] as const
    SKIP_EVENTS.forEach((type) => window.addEventListener(type, skip, { passive: true, once: true }))

    const letters = lettersRef.current
    let last = start
    const tick = (now: number) => {
      // Timed, not counted per frame: a throttled or busy tab draws few
      // frames, and a per-frame step would leave the curtain down long after
      // the frames have arrived. Eases toward the real value, never slower
      // than a full count in about a second, never ahead of it.
      const dt = Math.min(Math.max((now - last) / 1000, 0), 0.5)
      last = now
      const step = Math.max((target - shown) * (1 - Math.exp(-dt * 6)), dt * 0.9)
      shown = skipped ? 1 : Math.min(target, shown + step)
      const pct = Math.round(shown * 100)
      if (countRef.current) countRef.current.textContent = String(pct).padStart(3, '0')
      rootRef.current?.style.setProperty('--p', shown.toFixed(4))
      const lit = Math.floor(shown * letters.length)
      letters.forEach((el, i) => {
        el.dataset.lit = i < lit ? 'true' : 'false'
      })

      if (shown >= 0.999 && now - start > minTime) {
        done = true
        document.documentElement.dataset.loaded = 'true'
        lockScroll(false)
        setPhase('leaving')
        leaveTimer = window.setTimeout(() => setPhase('gone'), skipped ? 700 : 1300)
        return
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(cap)
      window.clearTimeout(leaveTimer)
      SKIP_EVENTS.forEach((type) => window.removeEventListener(type, skip))
      unsubscribe()
      if (!done) lockScroll(false)
    }
    // Runs once per page load: re-running after the curtain has lifted would
    // lock the page again. The language can change underneath it freely.
  }, [])

  if (phase === 'gone') return null

  let letterIndex = 0
  lettersRef.current = []

  return (
    <div className="preloader" ref={rootRef} data-phase={phase} aria-hidden="true">
      <div className="preloader__top">
        <span className="preloader__brand">
          <SolisLogo />
          {t.preloader.label}
        </span>
        <span>{t.preloader.meta}</span>
      </div>

      <p className="preloader__line display">
        {lines.map((line) => (
          <span key={line} className="preloader__row">
            {Array.from(line).map((ch, i) => {
              const index = letterIndex
              letterIndex += 1
              return (
                <span
                  key={`${ch}-${i}`}
                  className="preloader__ch"
                  ref={(el) => {
                    if (el) lettersRef.current[index] = el
                  }}
                >
                  {ch === ' ' ? ' ' : ch}
                </span>
              )
            })}
          </span>
        ))}
      </p>

      <div className="preloader__bottom">
        <span className="preloader__label">{t.preloader.loading}</span>
        <span className="preloader__count">
          <span ref={countRef}>000</span>
          <small>/ 100</small>
        </span>
      </div>
      <span className="preloader__bar" />
    </div>
  )
}
