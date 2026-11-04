import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

/** Never back the canvas with more than a 4K screen's width of pixels. */
const MAX_BACKING_WIDTH = 3840

/**
 * Loads a numbered frame sequence and draws one frame at a time to a canvas.
 * Adapted from the Hitachi hero's loader.
 *
 * WHY A CANVAS AND NOT A <video>
 * ------------------------------
 * A video seek is a request, not a guarantee: the decoder may drop it, round
 * it to a nearby keyframe, or still be servicing it when the scroll has moved
 * on. Frame N is simply frame N, in every browser, forwards and backwards
 * alike — which is what makes reverse scrolling land exactly.
 *
 * DRAWING
 * -------
 * `fit: 'cover'` (the film edition): the canvas fills its box and is backed
 * at the screen's own pixel density (devicePixelRatio, up to a 4K width), and
 * each frame is drawn "cover" — scaled to fill, centred, the overflow cropped
 * — with high-quality smoothing. On a 4K screen that is the film at its full
 * 1080p detail with no second, blurrier browser rescale on top.
 *
 * `fit: 'frame'` (the studio edition): the canvas takes each frame's own
 * pixels and CSS sizes it; the frames are cut-outs with transparency, so the
 * canvas is cleared before every draw.
 *
 * LOADING
 * -------
 * Frames are fetched in order behind a small request pool, so the first frame
 * paints almost immediately and the rest fill in behind it. Until a given
 * frame has loaded, the nearest one that *has* is drawn instead — searching
 * outward from the wanted index — so scrubbing during load is continuous
 * rather than blank.
 *
 * The sequence is considered failed if frame 0 will not load, or if more than
 * half the frames fail. Callers render their own fallback from `failed`.
 */
export interface UseFrameSequenceOptions {
  /** frame URLs, already in order */
  urls: string[]
  /** ref to the target <canvas> */
  canvasRef: RefObject<HTMLCanvasElement | null>
  /** frames in flight at once */
  concurrency?: number
  /** called as frames arrive (or fail) — the preloader's counter reads this */
  onProgress?: (settled: number, count: number) => void
  /** see DRAWING above */
  fit?: 'cover' | 'frame'
}

export interface UseFrameSequenceResult {
  draw: (index: number) => void
  /** true once the first frame is on the canvas */
  ready: boolean
  failed: boolean
  count: number
}

export function useFrameSequence({
  urls,
  canvasRef,
  concurrency = 6,
  onProgress,
  fit = 'cover',
}: UseFrameSequenceOptions): UseFrameSequenceResult {
  const count = urls.length
  const onProgressRef = useRef(onProgress)
  onProgressRef.current = onProgress
  const imagesRef = useRef<(HTMLImageElement | undefined)[]>([])
  const wantedRef = useRef(0)
  const drawnRef = useRef<HTMLImageElement | null>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  const paint = useCallback(
    (image: HTMLImageElement, force = false) => {
      const canvas = canvasRef.current
      if (!canvas || (!force && drawnRef.current === image)) return
      if (fit === 'frame') {
        if (canvas.width !== image.naturalWidth) {
          canvas.width = image.naturalWidth
          canvas.height = image.naturalHeight
        }
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
        drawnRef.current = image
        return
      }
      const ctx = canvas.getContext('2d', { alpha: false })
      if (!ctx) return
      const cw = canvas.width
      const ch = canvas.height
      const iw = image.naturalWidth
      const ih = image.naturalHeight
      if (!cw || !ch || !iw || !ih) return
      // Cover: the largest centred crop of the frame with the canvas's shape.
      const scale = Math.max(cw / iw, ch / ih)
      const sw = cw / scale
      const sh = ch / scale
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(image, (iw - sw) / 2, (ih - sh) / 2, sw, sh, 0, 0, cw, ch)
      drawnRef.current = image
    },
    [canvasRef, fit],
  )
  const paintRef = useRef(paint)
  paintRef.current = paint

  // Keep the backing store matched to the box at the screen's density, and
  // repaint whatever was showing when it changes. (Cover only: a 'frame'
  // canvas is sized by the frames themselves.)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || fit !== 'cover') return undefined
    const fitBox = () => {
      // Layout size, not getBoundingClientRect: the box may carry a zoom
      // transform, and the backing store should follow the box, not the zoom.
      const cssW = canvas.clientWidth
      const cssH = canvas.clientHeight
      const dpr = window.devicePixelRatio || 1
      const k = Math.min(dpr, MAX_BACKING_WIDTH / Math.max(cssW, 1))
      const w = Math.max(1, Math.round(cssW * k))
      const h = Math.max(1, Math.round(cssH * k))
      if (canvas.width === w && canvas.height === h) return
      canvas.width = w
      canvas.height = h
      if (drawnRef.current) paintRef.current(drawnRef.current, true)
    }
    fitBox()
    const ro = new ResizeObserver(fitBox)
    ro.observe(canvas)
    // Moving the window to a screen of another density changes no box size.
    const dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`)
    dprQuery.addEventListener('change', fitBox)
    return () => {
      ro.disconnect()
      dprQuery.removeEventListener('change', fitBox)
    }
  }, [canvasRef, fit])

  const draw = useCallback(
    (index: number) => {
      const images = imagesRef.current
      const clamped = Math.min(Math.max(index, 0), count - 1)
      wantedRef.current = clamped

      let image = images[clamped]
      if (!image) {
        // Nearest frame that has arrived, so a scrub mid-load never goes blank.
        for (let step = 1; step < count; step += 1) {
          image = images[clamped - step] ?? images[clamped + step]
          if (image) break
        }
      }
      if (image) paint(image)
    },
    [count, paint],
  )

  useEffect(() => {
    if (!count) {
      setFailed(true)
      return undefined
    }

    let cancelled = false
    const images: (HTMLImageElement | undefined)[] = new Array(count)
    imagesRef.current = images
    drawnRef.current = null
    let next = 0
    let failures = 0
    let settled = 0

    const loadNext = () => {
      if (cancelled) return
      const index = next
      next += 1
      if (index >= count) return

      const img = new Image()
      img.decoding = 'async'
      const done = (ok: boolean) => {
        if (cancelled) return
        if (ok) {
          images[index] = img
          // Paint it the moment it arrives if it is the frame being asked for,
          // or if nothing better has been drawn yet.
          if (index === wantedRef.current || !drawnRef.current) paintRef.current(img)
          if (index === 0) setReady(true)
        } else {
          failures += 1
          if (index === 0 || failures > count / 2) setFailed(true)
        }
        settled += 1
        onProgressRef.current?.(settled, count)
        loadNext()
      }
      img.onload = () => done(true)
      img.onerror = () => done(false)
      img.src = urls[index] ?? ''
    }

    for (let k = 0; k < concurrency; k += 1) loadNext()
    return () => {
      cancelled = true
    }
  }, [urls, count, concurrency])

  return { draw, ready, failed, count }
}
