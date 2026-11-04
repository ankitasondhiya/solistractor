import { m } from 'motion/react'
import type { ReactNode } from 'react'

/**
 * A filter chip whose navy highlight travels to the chip you press instead of
 * blinking from one to the other (a shared-layout move: the eye follows the
 * selection). Chips in one group share a `group` name. Without Motion's
 * features loaded yet — or with motion paused — the highlight simply appears.
 */
export function SlideChip({
  group,
  pressed,
  onClick,
  children,
}: {
  group: string
  pressed: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button type="button" className="chip" data-slide="true" aria-pressed={pressed} onClick={onClick}>
      {pressed && <m.span layoutId={`chip-pill-${group}`} className="chip__pill" aria-hidden="true" />}
      <span className="chip__label">{children}</span>
    </button>
  )
}
