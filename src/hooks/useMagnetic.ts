import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useMotion } from '../motion/MotionContext'

/**
 * Lets an element lean toward the pointer while it is over it, and spring
 * back when it leaves — for the one focal action on a screen, not for every
 * button (a field of magnets reads as noise).
 *
 * The pull is clamped to `strength` of the pointer's offset from the centre,
 * so the element never slides out from under the cursor. Fine pointers only,
 * and off whenever motion is calm. Put the ref on a wrapper, not the button
 * itself: the button keeps its own CSS hover lift and press scale, the
 * wrapper carries the pull.
 */
export function useMagnetic<T extends HTMLElement>(strength = 0.3) {
  const ref = useRef<T>(null)
  const { calm } = useMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || calm || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined

    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'elastic.out(1, 0.45)' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'elastic.out(1, 0.45)' })
    const onPointerMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      xTo((e.clientX - r.left - r.width / 2) * strength)
      yTo((e.clientY - r.top - r.height / 2) * strength)
    }
    const onPointerLeave = () => {
      xTo(0)
      yTo(0)
    }
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerleave', onPointerLeave)
    return () => {
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerleave', onPointerLeave)
      gsap.killTweensOf(el)
      gsap.set(el, { x: 0, y: 0 })
    }
  }, [calm, strength])

  return ref
}
