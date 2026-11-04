/**
 * A shared-element move between two images that live in different parts of
 * the page: a copy of the picture flies from where the reader clicked to
 * where it lands (ui-ux-pro-max: shared-element-transition, modal-motion —
 * "animate from the trigger"), so the eye follows the tractor into the panel.
 *
 * The landing spot is measured again on every frame, so it can be moving —
 * a panel sliding in — and the copy still lands exactly on the real image.
 * Both real images are hidden during the flight and shown again at the end.
 * The caller skips this when motion is paused or reduced.
 */
export function flyImage(
  from: HTMLImageElement,
  to: () => HTMLImageElement | null,
  duration: number,
): () => void {
  const start = from.getBoundingClientRect()
  const firstTarget = to()
  if (!firstTarget || start.width < 4 || start.height < 4) return () => {}

  const clone = document.createElement('img')
  clone.src = from.currentSrc || from.src
  clone.alt = ''
  clone.setAttribute('aria-hidden', 'true')
  Object.assign(clone.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    zIndex: '70',
    objectFit: 'contain',
    pointerEvents: 'none',
    willChange: 'transform, width, height',
    filter: 'drop-shadow(0 22px 26px rgba(12, 30, 82, 0.25))',
  } satisfies Partial<CSSStyleDeclaration>)
  document.body.appendChild(clone)

  const hidden = [from, firstTarget]
  const before = hidden.map((el) => el.style.visibility)
  hidden.forEach((el) => {
    el.style.visibility = 'hidden'
  })

  let frame = 0
  let done = false
  const t0 = performance.now()
  // Decelerating arrival (expo-out), like the page's --ease-out.
  const ease = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))

  const finish = () => {
    if (done) return
    done = true
    cancelAnimationFrame(frame)
    clone.remove()
    hidden.forEach((el, i) => {
      el.style.visibility = before[i] ?? ''
    })
  }

  const tick = (now: number) => {
    const t = Math.min(1, (now - t0) / duration)
    const e = ease(t)
    const target = (to() ?? firstTarget).getBoundingClientRect()
    const x = start.left + (target.left - start.left) * e
    const y = start.top + (target.top - start.top) * e
    const w = start.width + (target.width - start.width) * e
    const h = start.height + (target.height - start.height) * e
    clone.style.width = `${w}px`
    clone.style.height = `${h}px`
    clone.style.transform = `translate3d(${x}px, ${y}px, 0)`
    if (t < 1) frame = requestAnimationFrame(tick)
    else finish()
  }
  tick(t0)
  frame = requestAnimationFrame(tick)
  return finish
}
