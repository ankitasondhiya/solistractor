import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from 'react'

interface RevealProps {
  as?: ElementType
  children: ReactNode
  className?: string
  /** ms before this element starts its entrance, for simple staggers */
  delay?: number
  id?: string
}

/**
 * Fades and lifts its children in the first time they enter the viewport.
 * The element is marked with `data-reveal`, and the CSS in global.css does the
 * animation; this component only flips `data-shown`. It never hides content
 * that has already been shown, and reduced motion is handled in CSS.
 */
export function Reveal({ as: Tag = 'div', children, className, delay = 0, id }: RevealProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    if (!('IntersectionObserver' in window)) {
      el.dataset.shown = 'true'
      return undefined
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.dataset.shown = 'true'
            io.disconnect()
          }
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      id={id}
      className={className}
      data-reveal=""
      style={delay ? ({ '--reveal-delay': `${delay}ms` } as CSSProperties) : undefined}
    >
      {children}
    </Tag>
  )
}
