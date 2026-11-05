import { interpolate, type ChapterTiming } from './timeline'

/**
 * The studio edition's hero (`/studio`), as a scroll story.
 *
 * Source: a 10 s, 24 fps studio clip of a blue Solis being built — chassis,
 * engine, wheels, seat and safety frame, bonnet, then the finished tractor
 * with its lights on (gemini_generated_video_6e54d97a.mp4). Resampled to 160
 * frames (16 fps), the generator's watermark removed, and the grey studio
 * keyed out to transparency with a soft floor shadow kept, so the machine can
 * stand in front of each chapter's word: public/frames/studio/{lg,sm}
 * (1280 and 720 px). scripts/cutout-frames.py is the keying step.
 *
 * Frame map (1-based, as on disk)
 *   1–24    chassis alone
 *   25–42   engine lowers and seats
 *   43–72   wheels drop and settle
 *   73–92   seat, safety frame and rear body
 *   93–106  bonnet lands — the machine is complete
 *   107–160 lights on, camera eases in
 */
export const FRAME_COUNT = 160

/** Frames that must be in before the preloader lifts — the intro and first chapter. */
export const PRELOAD_FRAMES = 48

export type FrameSize = 'lg' | 'sm'

export function frameUrls(size: FrameSize): string[] {
  return Array.from(
    { length: FRAME_COUNT },
    (_, i) => `/frames/studio/${size}/frame-${String(i + 1).padStart(3, '0')}.webp`,
  )
}

/**
 * Progress → frame index (0-based). Each chapter holds while the part it is
 * about has landed and barely moves; the drops happen in the gaps between
 * chapters, where there is no copy to read.
 */
const FRAME_CURVE: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [0.05, 2],
  [0.1, 12],
  [0.21, 22],
  [0.245, 25],
  [0.29, 38],
  [0.37, 41],
  [0.405, 44],
  [0.45, 60],
  [0.535, 68],
  [0.57, 73],
  [0.615, 84],
  [0.7, 92],
  [0.735, 95],
  [0.8, 106],
  [0.9, 128],
  [1, 159],
]

export function frameAt(progress: number): number {
  return Math.round(interpolate(FRAME_CURVE, progress))
}

export interface StudioChapter extends ChapterTiming {
  /**
   * A point on the part this chapter is about, in frame coordinates (0..1),
   * at the chapter's held frame, and where its tag sits relative to it, as a
   * fraction of the picture's size.
   */
  anchor?: { x: number; y: number; dx: number; dy: number }
}

/** The assembly's order: the wheels go on before the seat and safety frame. */
export const CHAPTERS: StudioChapter[] = [
  { id: 'frame', enter: 0.1, hold: 0.135, release: 0.21, exit: 0.245, anchor: { x: 0.42, y: 0.55, dx: 0.05, dy: -0.1 } },
  { id: 'engine', enter: 0.255, hold: 0.29, release: 0.37, exit: 0.405, anchor: { x: 0.52, y: 0.34, dx: 0.06, dy: -0.1 } },
  { id: 'grip', enter: 0.415, hold: 0.45, release: 0.535, exit: 0.57, anchor: { x: 0.73, y: 0.58, dx: 0.04, dy: -0.14 } },
  { id: 'comfort', enter: 0.58, hold: 0.615, release: 0.7, exit: 0.735, anchor: { x: 0.62, y: 0.3, dx: 0.07, dy: -0.08 } },
  { id: 'ready', enter: 0.8, hold: 0.845, release: 1.1, exit: 1.2 },
]

/**
 * The camera, as [progress, x (vw), y (vh), scale]. Under the intro headline
 * the machine stands in the middle; once the chapters begin, each chapter's
 * word and copy take a column on the left and the machine moves into the
 * space to its right (see `lane`), so nothing it says is ever behind it. The
 * y keys keep every chapter's machine clear of the header above and of the
 * dots and badge below; the scale breathes — tighter on the small parts,
 * wider once the wheels are on.
 */
type CameraKey = readonly [number, number, number, number]

const CAMERA_DESKTOP: ReadonlyArray<CameraKey> = [
  [0, 0, 12, 0.86],
  [0.05, 0, 12, 0.86],
  [0.135, 0, 4, 1],
  [0.21, 0, 4, 1],
  [0.29, 0, 4, 1],
  [0.37, 0, 4, 1],
  // Wheels on: the picture runs from the mirror (0.145) to the tyres (0.97).
  [0.45, 0, -7.5, 0.86],
  [0.535, 0, -7.5, 0.86],
  [0.615, 0, -4, 0.84],
  [0.7, 0, -4, 0.84],
  [0.8, 0, -1.5, 0.84],
  [1, 0, -1.5, 0.84],
]

/**
 * How far the chapter column is in play: 0 under the intro headline (the
 * machine centred), 1 from the first chapter on (the machine to the right).
 */
const LANE: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [0.05, 0],
  [0.12, 1],
  [1, 1],
]

/**
 * Where the machine sits across its picture as the film runs, as
 * [progress, left, right] in shares of the frame's width, measured from the
 * frames (alpha over the background). Where the film widens at once — the
 * wheels arriving from the sides at 0.41, the cut to the closer camera at
 * 0.86 — the span widens just ahead of it, while the previous chapter fades,
 * so the machine never runs into the column. The closing camera move shifts
 * it left.
 */
const MACHINE_SPAN: ReadonlyArray<readonly [number, number, number]> = [
  [0, 0.25, 0.766],
  [0.25, 0.255, 0.759],
  [0.37, 0.277, 0.737],
  [0.41, 0.159, 0.889],
  [0.44, 0.159, 0.889],
  [0.47, 0.18, 0.872],
  [0.535, 0.191, 0.86],
  [0.58, 0.189, 0.852],
  [0.6, 0.189, 0.787],
  [0.845, 0.205, 0.787],
  [0.86, 0.214, 0.83],
  [0.93, 0.214, 0.826],
  [0.96, 0.194, 0.818],
  [0.98, 0.158, 0.804],
  [1, 0.105, 0.784],
]

/** A little room either side of the machine, for its shadow and the callout tags. */
const SPAN_PAD = 0.02

/**
 * On a narrow screen the copy goes above and the cards below, so through the
 * chapters the camera stays put: the machine fills the band between them
 * (`band`), the keys only setting its largest size.
 */
const CAMERA_MOBILE: ReadonlyArray<CameraKey> = [
  [0, 4, 12, 1],
  [0.05, 4, 12, 1],
  [0.135, 4, 4, 1],
  [0.765, 4, 4, 1],
  [0.845, 4, 2, 0.94],
  [1, 4, 2, 0.94],
]

/**
 * The height the machine needs on a narrow screen, as [top, bottom] in shares
 * of the frame's height: every chapter's machine, from the safety frame at
 * the close to the tyres once the wheels are on. Parts dropping in from above
 * pass through the copy only between chapters.
 */
const MOBILE_SPAN_Y = [0.03, 0.975] as const

export interface Camera {
  x: number
  y: number
  scale: number
}

export interface CameraView {
  mobile: boolean
  /** the window, in px */
  width: number
  height: number
  /** px from the left edge taken by the chapter column, its gap included */
  reserve: number
  /** px kept clear along the right edge */
  margin: number
  /** narrow screens: the px band between the chapter copy and the cards */
  band?: { top: number; bottom: number }
}

/** The canvas: 16:9, as wide as the window or as tall as it, and 165vw wide in portrait (studio-hero.css). */
function pictureWidth(view: CameraView): number {
  return view.width <= view.height ? 1.65 * view.width : Math.min(view.width, (view.height * 16) / 9)
}

/**
 * On desktop the keys give the framing; the lane then moves the machine into
 * the free space right of the chapter column and, where that space is
 * narrower than the keys assume (a squarer window), draws it smaller. On a
 * narrow screen the lane moves it into the band between copy and cards.
 */
export function cameraAt(progress: number, view: CameraView): Camera {
  const keys = view.mobile ? CAMERA_MOBILE : CAMERA_DESKTOP
  const cam = {
    x: interpolate(keys.map((k) => [k[0], k[1]] as const), progress, true),
    y: interpolate(keys.map((k) => [k[0], k[2]] as const), progress, true),
    scale: interpolate(keys.map((k) => [k[0], k[3]] as const), progress, true),
  }
  if (view.width <= 0) return cam
  const lane = interpolate(LANE, progress, true)
  const picture = pictureWidth(view)
  const spanLeft = interpolate(MACHINE_SPAN.map((s) => [s[0], s[1] - SPAN_PAD] as const), progress, true)
  const spanRight = interpolate(MACHINE_SPAN.map((s) => [s[0], s[2] + SPAN_PAD] as const), progress, true)

  if (view.mobile) {
    const band = view.band
    if (!band || band.bottom <= band.top) return cam
    const [top, bottom] = MOBILE_SPAN_Y
    const pictureHeight = (picture * 9) / 16
    // As large as the band allows, and never wider than the screen.
    const scale = Math.min(
      cam.scale,
      (band.bottom - band.top) / ((bottom - top) * pictureHeight),
      view.width / ((spanRight - spanLeft) * picture),
    )
    // The middle of the span to the middle of the band, and of the screen.
    const offsetY = (band.top + band.bottom) / 2 - view.height / 2 - ((top + bottom) / 2 - 0.5) * pictureHeight * scale
    const offsetX = -((spanLeft + spanRight) / 2 - 0.5) * picture * scale
    cam.x += ((offsetX / view.width) * 100 - cam.x) * lane
    cam.y += ((offsetY / view.height) * 100 - cam.y) * lane
    cam.scale += (scale - cam.scale) * lane
    return cam
  }

  const left = view.reserve * lane
  const right = view.width - view.margin * lane
  // Smaller where the free space is narrower than the keys assume.
  cam.scale = Math.min(cam.scale, (right - left) / ((spanRight - spanLeft) * picture))
  // The machine's middle to the middle of the free space.
  const machineMiddle = view.width / 2 + ((spanLeft + spanRight) / 2 - 0.5) * picture * cam.scale
  const target = (left + right) / 2
  cam.x += (((target - machineMiddle) * lane) / view.width) * 100
  return cam
}
