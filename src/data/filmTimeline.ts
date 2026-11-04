import { interpolate, smooth, type ChapterTiming } from './timeline'

/**
 * The film edition's hero (`/`), as a scroll story.
 *
 * Source: a 10 s, 24 fps, 1920×1080 film of a Solis S75 being built and put
 * to work — a wheel hub and front axle assembling in a dark studio, the body
 * and bonnet landing in a shower of sparks, the driver climbing aboard, the
 * headlights coming on, a tyre in macro, then sunrise over a field with the
 * tractor working a rotavator. Resampled to 120 frames (12 fps), the
 * generator's watermark removed, at two widths: public/frames/film/lg (1920, the
 * source's full resolution) and public/frames/film/md (1280, for slow
 * connections). scripts/extract-frames.mjs rebuilds both from a new film.
 *
 * Frame map (1-based, as on disk)
 *   1–4     a wheel hub, lit teal
 *   5–20    the front axle assembles and turns
 *   21–44   body and bonnet land, sparks, the driver gets in
 *   45–56   headlights on — the finished tractor in the studio
 *   57–76   a tyre in macro, rolling out onto soil
 *   77–108  sunrise: the tractor working a field towards camera
 *   109–120 the rear tyre, close, in the field
 *
 * Everything below is expressed in story progress (see timeline.ts), so the
 * copy and the film are timed against the same clock — the arrangement the
 * Hitachi hero uses.
 */
export const FRAME_COUNT = 120

/** Frames that must be in before the preloader lifts — the intro and first chapter. */
export const PRELOAD_FRAMES = 30

export type FrameSize = 'lg' | 'md'

export function frameUrls(size: FrameSize): string[] {
  return Array.from(
    { length: FRAME_COUNT },
    (_, i) => `/frames/film/${size}/frame-${String(i + 1).padStart(3, '0')}.webp`,
  )
}

/**
 * Progress → frame index (0-based). Not linear: each chapter holds on the
 * shot it is about, and the cuts — axle to tractor, studio to field — fall in
 * the gaps between chapters, where there is no copy to read.
 */
const FRAME_CURVE: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [0.05, 3],
  [0.1, 7],
  [0.2, 18],
  [0.235, 21],
  [0.275, 28],
  [0.355, 40],
  [0.39, 44],
  [0.44, 48],
  [0.52, 55],
  [0.555, 57],
  [0.605, 62],
  [0.68, 70],
  [0.72, 77],
  [0.8, 86],
  [0.93, 104],
  [1, 119],
]

export function frameAt(progress: number): number {
  return Math.round(interpolate(FRAME_CURVE, progress))
}

/** The film's order: workstation (driver, lights) before grip (the tyre). */
export const CHAPTERS: ChapterTiming[] = [
  { id: 'frame', enter: 0.1, hold: 0.13, release: 0.195, exit: 0.225 },
  { id: 'engine', enter: 0.245, hold: 0.275, release: 0.355, exit: 0.39 },
  { id: 'comfort', enter: 0.41, hold: 0.44, release: 0.52, exit: 0.555 },
  { id: 'grip', enter: 0.575, hold: 0.605, release: 0.68, exit: 0.715 },
  { id: 'ready', enter: 0.76, hold: 0.8, release: 1.1, exit: 1.2 },
]

/**
 * The picture's scale: a slow push-in while the intro is up, then still. The
 * film carries its own camera moves; a second one on top would only fight it.
 */
export function zoomAt(progress: number): number {
  return 1.06 - 0.06 * smooth(progress / 0.12)
}
