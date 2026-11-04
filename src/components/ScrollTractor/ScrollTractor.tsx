import { useEffect, useRef } from 'react'
import './scroll-tractor.css'

import { useMotion } from '../../motion/MotionContext'
import { models } from '../../data/models'

/**
 * The studio edition's companion (after Ascenta Studio's hummingbird): once
 * the hero's tractor is built, a small Solis drives along a track at the foot
 * of the screen, as far along it as the reader is through the rest of the
 * page. It faces the way the reader is scrolling and kicks up a little dust
 * when they scroll fast. Decorative only; off when motion is calm.
 */
export function ScrollTractor() {
  const { calm } = useMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const rigRef = useRef<HTMLDivElement>(null)
  const dustRef = useRef<HTMLSpanElement>(null)
  const fillRef = useRef<HTMLSpanElement>(null)
  const image = models[0]?.image

  useEffect(() => {
    const root = rootRef.current
    const rig = rigRef.current
    if (calm || !root || !rig) return undefined

    let lastY = window.scrollY
    let facing = 1
    let speed = 0
    let frame = 0

    const update = () => {
      frame = 0
      const hero = document.getElementById('top')
      const start = hero ? hero.offsetTop + hero.offsetHeight - window.innerHeight : 0
      const end = document.documentElement.scrollHeight - window.innerHeight
      const y = window.scrollY
      const p = Math.min(1, Math.max(0, (y - start) / Math.max(1, end - start)))
      const dy = y - lastY
      lastY = y
      if (dy !== 0) facing = dy > 0 ? 1 : -1
      speed = Math.min(1, speed * 0.6 + Math.abs(dy) / 90)

      root.dataset.show = y > start - 40 ? 'true' : 'false'
      const track = root.clientWidth - rig.offsetWidth
      const x = p * track
      const bounce = Math.sin(x * 0.09) * 1.2 * Math.min(1, Math.abs(dy) / 6)
      rig.style.transform = `translate3d(${x.toFixed(1)}px, ${bounce.toFixed(2)}px, 0)`
      rig.dataset.facing = facing > 0 ? 'right' : 'left'
      if (dustRef.current) dustRef.current.style.opacity = (speed * 0.9).toFixed(2)
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${p.toFixed(4)})`
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [calm])

  if (calm || !image) return null

  return (
    <div className="scroll-tractor" ref={rootRef} data-show="false" aria-hidden="true">
      <span className="scroll-tractor__track">
        <span className="scroll-tractor__fill" ref={fillRef} />
      </span>
      <div className="scroll-tractor__rig" ref={rigRef} data-facing="right">
        <span className="scroll-tractor__dust" ref={dustRef} />
        <img src={image} alt="" />
      </div>
    </div>
  )
}
