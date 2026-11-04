import { LazyMotion, MotionConfig } from 'motion/react'
import type { ReactNode } from 'react'

import { useMotion } from './MotionContext'

const loadFeatures = () => import('./motionFeatures').then((m) => m.default)

/**
 * Motion (motion.dev) for the component-level moves GSAP and CSS don't do
 * well: list items gliding to a new order (FLIP layout), a highlight that
 * travels between filter chips (shared layout), and things that animate on
 * their way out (exit). GSAP + Lenis keep the scroll-scrubbed film.
 *
 * Its features load lazily as their own chunk. It follows the page's motion
 * setting: "Pause motion" or the system's reduced-motion preference turns
 * transforms and layout moves off, leaving instant changes.
 */
export function MotionLayer({ children }: { children: ReactNode }) {
  const { calm } = useMotion()
  return (
    <LazyMotion features={loadFeatures} strict>
      {/* Same rhythm as the CSS tokens: --dur-3 with the arriving (expo-out) curve. */}
      <MotionConfig reducedMotion={calm ? 'always' : 'user'} transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  )
}
