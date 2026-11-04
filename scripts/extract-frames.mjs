#!/usr/bin/env node
/**
 * Rebuilds the film edition's frame sequence (the hero at `/`) from a film.
 *
 *   node scripts/extract-frames.mjs <video.mp4> [--fps 12] [--delogo x:y:w:h]
 *
 * Writes public/frames/film/lg (the source's own width, capped at 3840) and
 * public/frames/film/md (1280) as frame-001.webp … The frame count it prints
 * must match FRAME_COUNT in src/data/filmTimeline.ts, and the chapter timing
 * there is written against the current film — retime it for a different cut.
 *
 * A 4K source gives 3840-wide frames and the canvas will show every pixel of
 * them on a 4K screen; the hero needs no other change. Requires ffmpeg and
 * ffprobe on PATH.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const args = process.argv.slice(2)
const input = args[0]
if (!input) {
  console.error('usage: node scripts/extract-frames.mjs <video.mp4> [--fps 12] [--delogo x:y:w:h]')
  process.exit(1)
}
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i > 0 && args[i + 1] ? args[i + 1] : fallback
}
const fps = Number(option('fps', '12'))
const delogo = option('delogo', '')

const width = Number(
  execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width', '-of', 'csv=p=0', input])
    .toString()
    .trim(),
)
const sizes = [
  { dir: 'lg', width: Math.min(width, 3840), quality: 72 },
  { dir: 'md', width: 1280, quality: 68 },
]

const filters = (w) =>
  [delogo && `delogo=${delogo.split(':').map((v, i) => `${'xywh'[i]}=${v}`).join(':')}`, `fps=${fps}`, w !== width && `scale=${w}:-2:flags=lanczos`]
    .filter(Boolean)
    .join(',')

for (const size of sizes) {
  const out = join('public', 'frames', 'film', size.dir)
  rmSync(out, { recursive: true, force: true })
  mkdirSync(out, { recursive: true })
  execFileSync(
    'ffmpeg',
    ['-v', 'error', '-y', '-i', input, '-vf', filters(size.width), '-c:v', 'libwebp', '-quality', String(size.quality), '-compression_level', '5', join(out, 'frame-%03d.webp')],
    { stdio: 'inherit' },
  )
  console.log(`${size.dir}: ${readdirSync(out).length} frames at ${size.width}px`)
}
