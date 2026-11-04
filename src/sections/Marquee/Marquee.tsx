import { useEffect, useRef, useState } from 'react'
import './marquee.css'

import { useLanguage } from '../../i18n/LanguageContext'
import { useMotion } from '../../motion/MotionContext'

/** px per second when the page is still */
const BASE_SPEED = 38

/**
 * A band of the range's headline facts that keeps moving. Scrolling pushes it
 * faster, and scrolling back up turns it round — so it answers the hand
 * rather than looping on its own clock.
 *
 * Moving content needs a way to stop it, so it stops itself whenever it
 * cannot be read or is being read: on hover, while anything in it has focus,
 * offscreen, in a hidden tab, and for good when the reader presses its pause
 * button or asks for calm motion page-wide.
 */
export function Marquee() {
  const { t } = useLanguage()
  const { calm } = useMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  // The loop's own run/stop decision, so the pause button can ask for it.
  const syncRef = useRef<() => void>(() => {})

  useEffect(() => {
    const root = rootRef.current
    const track = trackRef.current
    if (!root || !track) return undefined
    if (calm) {
      track.style.transform = 'translate3d(0, 0, 0)'
      return undefined
    }

    let x = 0
    let direction = -1
    let boost = 0
    let lastY = window.scrollY
    let lastTime = 0
    let frame = 0
    let onscreen = true
    let held = false // hover or focus inside

    const running = () => onscreen && !held && !document.hidden && !pausedRef.current

    const tick = (now: number) => {
      frame = 0
      if (!running()) return
      const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0
      lastTime = now
      boost *= 0.92
      const half = track.scrollWidth / 2
      x += direction * (BASE_SPEED + boost) * dt
      if (half > 0) {
        if (x <= -half) x += half
        if (x > 0) x -= half
      }
      track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`
      frame = requestAnimationFrame(tick)
    }

    // One place decides whether the loop runs, so every pause reason composes.
    const sync = () => {
      if (running()) {
        if (!frame) {
          lastTime = 0
          frame = requestAnimationFrame(tick)
        }
      } else if (frame) {
        cancelAnimationFrame(frame)
        frame = 0
      }
    }

    const onScroll = () => {
      const y = window.scrollY
      const dy = y - lastY
      lastY = y
      if (dy !== 0) direction = dy > 0 ? -1 : 1
      boost = Math.min(boost + Math.abs(dy) * 0.6, 900)
    }
    const hold = () => {
      held = true
      sync()
    }
    const release = () => {
      held = root.matches(':hover') || root.contains(document.activeElement)
      sync()
    }

    const io = new IntersectionObserver(([entry]) => {
      onscreen = entry?.isIntersecting ?? true
      sync()
    })
    io.observe(root)
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('visibilitychange', sync)
    root.addEventListener('pointerenter', hold)
    root.addEventListener('pointerleave', release)
    root.addEventListener('focusin', hold)
    root.addEventListener('focusout', release)
    syncRef.current = sync
    sync()

    return () => {
      if (frame) cancelAnimationFrame(frame)
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', sync)
      root.removeEventListener('pointerenter', hold)
      root.removeEventListener('pointerleave', release)
      root.removeEventListener('focusin', hold)
      root.removeEventListener('focusout', release)
      syncRef.current = () => {}
    }
  }, [calm])

  useEffect(() => syncRef.current(), [paused])

  // Two identical halves: the loop wraps at exactly half the track's width.
  const half = [...t.marquee, ...t.marquee]

  return (
    <div className="marquee" ref={rootRef} role="region" aria-label={t.marquee.join(' · ')}>
      <div className="marquee__track" ref={trackRef} aria-hidden="true">
        {[0, 1].map((copy) => (
          <div className="marquee__half" key={copy}>
            {half.map((item, i) => (
              <span className="marquee__item" key={`${copy}-${i}`}>
                {item}
                <span className="marquee__mark" />
              </span>
            ))}
          </div>
        ))}
      </div>
      {!calm && (
        <button
          type="button"
          className="marquee__toggle"
          aria-pressed={paused}
          aria-label={paused ? t.motion.tickerPlay : t.motion.tickerPause}
          onClick={() => setPaused((p) => !p)}
        >
          <span className="motion-toggle__icon" data-paused={paused ? 'true' : 'false'} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
