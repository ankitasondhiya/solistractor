/**
 * The clock both heroes share: story progress, 0..1 over the pinned section,
 * against which each edition times its frames, copy and camera
 * (filmTimeline.ts, studioTimeline.ts).
 */
export interface ChapterTiming {
  /** matches an `id` in `hero.chapters` (i18n/copy.ts) */
  id: string
  /** fade in from `enter` to `hold`, fully shown until `release`, gone by `exit` */
  enter: number
  hold: number
  release: number
  exit: number
}

/** Intro copy is on screen at load and leaves as the story starts. */
export const INTRO = { hold: 0.035, exit: 0.085 }

/** 0 → 1 → 0 across a chapter's window. */
export function chapterAlpha(p: number, c: Pick<ChapterTiming, 'enter' | 'hold' | 'release' | 'exit'>): number {
  if (p <= c.enter || p >= c.exit) return 0
  if (p < c.hold) return smooth((p - c.enter) / (c.hold - c.enter))
  if (p <= c.release) return 1
  return 1 - smooth((p - c.release) / (c.exit - c.release))
}

/** Progress at which a chapter is fully on screen — where its rail link scrolls to. */
export function chapterTarget(c: ChapterTiming): number {
  return Math.min(c.hold + (Math.min(c.release, 1) - c.hold) * 0.35, 1)
}

/** "01 · Fundament": a chapter's label, numbered by its place in an edition. */
export function chapterKicker(index: number, label: string): string {
  return `${String(index + 1).padStart(2, '0')} · ${label}`
}

export function smooth(t: number): number {
  const x = Math.min(Math.max(t, 0), 1)
  return x * x * (3 - 2 * x)
}

/** Piecewise interpolation over sorted [x, y] keys; optionally eased between keys. */
export function interpolate(keys: ReadonlyArray<readonly [number, number]>, x: number, eased = false): number {
  const first = keys[0]
  const last = keys[keys.length - 1]
  if (!first || !last) return 0
  if (x <= first[0]) return first[1]
  if (x >= last[0]) return last[1]
  for (let i = 1; i < keys.length; i += 1) {
    const b = keys[i]
    const a = keys[i - 1]
    if (!a || !b) continue
    if (x <= b[0]) {
      const t = (x - a[0]) / (b[0] - a[0] || 1)
      return a[1] + (b[1] - a[1]) * (eased ? smooth(t) : t)
    }
  }
  return last[1]
}
