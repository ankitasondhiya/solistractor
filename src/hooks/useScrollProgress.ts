import { useEffect, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { ProgressStore } from './progressStore'

gsap.registerPlugin(ScrollTrigger)

/** Below this the loop has caught up and can stop until the next scroll. */
const SETTLE = 0.0004

interface UseScrollProgressOptions {
  sectionRef: RefObject<HTMLElement | null>
  store: ProgressStore
  enabled: boolean
  /**
   * How hard the eased position chases the scroll position; 1 = no
   * smoothing. With Lenis already easing the scroll itself a light touch is
   * enough — the two compounding would make the picture lag the hand.
   */
  smoothing?: number
}

/**
 * Binds vertical scroll over `sectionRef` to a normalised 0..1 story position.
 *
 * ScrollTrigger reports the raw scroll position; an animation-frame loop eases
 * the published position toward it, so fast flicks and reverse scrolling both
 * read smoothly rather than jumping. The loop parks itself once it has caught
 * up, so a stationary reader costs nothing.
 */
export function useScrollProgress({
  sectionRef,
  store,
  enabled,
  smoothing = 0.14,
}: UseScrollProgressOptions): void {
  useEffect(() => {
    const section = sectionRef.current
    if (!section || !enabled) return undefined

    let target = 0
    let current = 0
    let frame = 0
    let running = false

    const tick = () => {
      const delta = target - current
      if (Math.abs(delta) < SETTLE) {
        current = target
        running = false
      } else {
        current += delta * smoothing
        frame = requestAnimationFrame(tick)
      }
      store.set(current)
    }

    const wake = () => {
      if (running) return
      running = true
      frame = requestAnimationFrame(tick)
    }

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        target = self.progress
        wake()
      },
      onRefresh: (self) => {
        target = self.progress
        current = self.progress
        wake()
      },
    })

    // The section is sized in vh, so its height changes whenever the viewport
    // does — including when a mobile browser's URL bar slides away. Without a
    // re-measure the trigger keeps mapping scroll to the old height and the
    // story runs out of step with the scrollbar.
    const resize = new ResizeObserver(() => ScrollTrigger.refresh())
    resize.observe(section)

    target = trigger.progress
    current = trigger.progress
    wake()

    return () => {
      cancelAnimationFrame(frame)
      running = false
      resize.disconnect()
      trigger.kill()
    }
  }, [sectionRef, store, enabled, smoothing])
}

/** The page offset at which a pinned section sits at a given progress value. */
export function progressTop(sectionRef: RefObject<HTMLElement | null>, progress: number): number | null {
  const section = sectionRef.current
  if (!section) return null
  const distance = section.offsetHeight - window.innerHeight
  const top = section.getBoundingClientRect().top + window.scrollY
  return top + distance * Math.min(Math.max(progress, 0), 1)
}
