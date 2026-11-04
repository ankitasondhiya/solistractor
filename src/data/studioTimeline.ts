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
 * The camera, as [progress, x (vw), y (vh), scale]. The machine stays centred
 * in front of its chapter's word — the copy lives in the corners and on
 * floating cards — and only the framing breathes: tighter on the small parts,
 * wider once the wheels are on.
 */
type CameraKey = readonly [number, number, number, number]

const CAMERA_DESKTOP: ReadonlyArray<CameraKey> = [
  [0, 0, 12, 0.86],
  [0.05, 0, 12, 0.86],
  [0.135, 0, 6, 0.98],
  [0.21, 0, 6, 1],
  [0.29, 0, 4, 1],
  [0.37, 0, 4, 1],
  [0.45, 0, 5, 0.9],
  [0.535, 0, 5, 0.9],
  [0.615, 0, 5, 0.88],
  [0.7, 0, 5, 0.88],
  [0.8, 0, 6, 0.84],
  [1, 0, 6, 0.86],
]

/** On a narrow screen the copy goes above and below, so the camera stays put. */
const CAMERA_MOBILE: ReadonlyArray<CameraKey> = [
  [0, 4, 12, 1],
  [0.05, 4, 12, 1],
  [0.135, 4, 4, 1],
  [0.765, 4, 4, 1],
  [0.845, 4, 2, 0.94],
  [1, 4, 2, 0.94],
]

export interface Camera {
  x: number
  y: number
  scale: number
}

/**
 * The desktop keys are composed for a 16:9 window. A squarer one leaves less
 * room between the corner copy and the floating cards, so the machine is
 * drawn a little smaller there.
 */
export function cameraAt(progress: number, mobile: boolean, aspect: number): Camera {
  const keys = mobile ? CAMERA_MOBILE : CAMERA_DESKTOP
  const cam = {
    x: interpolate(keys.map((k) => [k[0], k[1]] as const), progress, true),
    y: interpolate(keys.map((k) => [k[0], k[2]] as const), progress, true),
    scale: interpolate(keys.map((k) => [k[0], k[3]] as const), progress, true),
  }
  if (mobile) return cam
  const k = Math.min(Math.max((aspect - 1.2) / (16 / 9 - 1.2), 0), 1)
  cam.scale *= 1 - (1 - k) * 0.14
  return cam
}
