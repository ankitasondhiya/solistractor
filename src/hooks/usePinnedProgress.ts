import { useMemo, type RefObject } from 'react'
import { createProgressStore, type ProgressStore } from './progressStore'
import { useScrollProgress } from './useScrollProgress'
import { useMotion } from '../motion/MotionContext'

/**
 * 0..1 progress through a tall section whose inner viewport is sticky — the
 * pattern every pinned section on this page shares. Lenis already eases the
 * scroll, so the extra smoothing is light; without Lenis it does the easing.
 */
export function usePinnedProgress(sectionRef: RefObject<HTMLElement | null>, enabled = true): ProgressStore {
  const { calm } = useMotion()
  const store = useMemo(() => createProgressStore(), [])
  useScrollProgress({ sectionRef, store, enabled, smoothing: calm ? 0.16 : 0.4 })
  return store
}

export function clamp01(v: number): number {
  return Math.min(Math.max(v, 0), 1)
}

export function easeOut(t: number): number {
  return 1 - Math.pow(1 - clamp01(t), 3)
}
