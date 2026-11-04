import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { useReducedMotion } from '../hooks/useReducedMotion'

gsap.registerPlugin(ScrollTrigger)

type ScrollTarget = number | string | HTMLElement

interface MotionValue {
  /** the operating system asks for reduced motion */
  systemReduced: boolean
  /** the reader pressed "Pause motion" */
  paused: boolean
  setPaused: (paused: boolean) => void
  /**
   * Either of the above: no smooth scrolling, no ambient loops, no companion.
   * Scroll-scrubbed pictures stay — the reader is the one moving them — unless
   * the system preference is set, in which case sections render statically.
   */
  calm: boolean
  /** Smooth-scrolls to a y offset, a selector or an element, through Lenis when it runs. */
  scrollTo: (target: ScrollTarget, options?: { offset?: number; immediate?: boolean }) => void
  /** Freezes page scrolling — for the preloader and the open mobile menu. */
  lockScroll: (locked: boolean) => void
}

const MotionContext = createContext<MotionValue | null>(null)
const STORAGE_KEY = 'solis-motion-paused'

function initialPaused(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * One smoothing chain for the whole page.
 *
 * Lenis eases the scroll position and GSAP's ticker is its clock, so every
 * ScrollTrigger — the hero film, the pinned gallery, the stacked cards —
 * reads the same smoothed position on the same frame. Two clocks would let
 * the sections drift against each other by a frame, which reads as judder.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const systemReduced = useReducedMotion()
  const [paused, setPausedState] = useState(initialPaused)
  const calm = systemReduced || paused
  const lenisRef = useRef<Lenis | null>(null)

  const setPaused = useCallback((next: boolean) => {
    setPausedState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
    } catch {
      // Not remembered across visits, but applied now.
    }
  }, [])

  useEffect(() => {
    document.documentElement.dataset.motion = calm ? 'calm' : 'full'
    if (calm) return undefined

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })
    lenisRef.current = lenis
    lenis.on('scroll', ScrollTrigger.update)
    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
    ScrollTrigger.refresh()

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
      lenisRef.current = null
      ScrollTrigger.refresh()
    }
  }, [calm])

  const scrollTo = useCallback<MotionValue['scrollTo']>(
    (target, options = {}) => {
      const offset = options.offset ?? 0
      const lenis = lenisRef.current
      if (lenis) {
        lenis.scrollTo(target, { offset, immediate: options.immediate, duration: 1.4 })
        return
      }
      let top: number
      if (typeof target === 'number') top = target
      else {
        const el = typeof target === 'string' ? document.querySelector(target) : target
        if (!el) return
        top = el.getBoundingClientRect().top + window.scrollY
      }
      window.scrollTo({ top: top + offset, behavior: options.immediate || calm ? 'auto' : 'smooth' })
    },
    [calm],
  )

  const lockScroll = useCallback((locked: boolean) => {
    document.documentElement.classList.toggle('scroll-locked', locked)
    const lenis = lenisRef.current
    if (!lenis) return
    if (locked) lenis.stop()
    else lenis.start()
  }, [])

  const value = useMemo<MotionValue>(
    () => ({ systemReduced, paused, setPaused, calm, scrollTo, lockScroll }),
    [systemReduced, paused, setPaused, calm, scrollTo, lockScroll],
  )

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>
}

export function useMotion(): MotionValue {
  const value = useContext(MotionContext)
  if (!value) throw new Error('useMotion must be used inside <MotionProvider>')
  return value
}
