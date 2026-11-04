import { useLayoutEffect, useRef } from 'react'

import { useMotion } from '../motion/MotionContext'

/**
 * A figure that counts to its new value instead of swapping — 650 kg rolling
 * up to 2.500 kg says "this one lifts far more" before the reader has read a
 * digit. Interruptible (a new value starts from wherever the roll is), set in
 * tabular figures so nothing jiggles, and instant when motion is paused or
 * reduced. Screen readers get the final value only.
 */
export function RollingNumber({
  value,
  format,
  duration = 700,
}: {
  value: number
  format: (n: number) => string
  duration?: number
}) {
  const { calm } = useMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const shown = useRef<number | null>(null)
  const formatRef = useRef(format)
  formatRef.current = format

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const from = shown.current
    if (from === null || calm || from === value) {
      shown.current = value
      el.textContent = formatRef.current(value)
      return undefined
    }
    let frame = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration)
      const e = 1 - Math.pow(1 - t, 3)
      const v = from + (value - from) * e
      shown.current = v
      el.textContent = formatRef.current(t < 1 ? v : value)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    tick(t0)
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, calm, duration])

  return (
    <>
      <span ref={ref} className="rolling" aria-hidden="true" />
      <span className="visually-hidden">{format(value)}</span>
    </>
  )
}
