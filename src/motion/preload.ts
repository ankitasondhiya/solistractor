import { createProgressStore } from '../hooks/progressStore'

/**
 * How ready the page is to be shown, 0..1.
 *
 * The preloader's counter is not a timer: it is the share of the hero's
 * opening frames that have arrived (each edition's PRELOAD_FRAMES). The hero
 * reports into this store and the preloader reads it, so "100" means the
 * first chapter can actually be scrubbed, not that an arbitrary delay has
 * passed.
 */
export const preload = createProgressStore()

/**
 * Runs `fn` once the preloader has lifted (it sets html[data-loaded]) plus
 * `delay` ms — for anything that should not open behind the curtain, like a
 * shared model link or the welcome-back note. Returns a cancel function.
 */
export function afterLoaded(fn: () => void, delay = 0): () => void {
  const root = document.documentElement
  let timer = 0
  const run = () => {
    timer = window.setTimeout(fn, delay)
  }
  if (root.dataset.loaded === 'true') {
    run()
    return () => window.clearTimeout(timer)
  }
  const observer = new MutationObserver(() => {
    if (root.dataset.loaded === 'true') {
      observer.disconnect()
      run()
    }
  })
  observer.observe(root, { attributes: true, attributeFilter: ['data-loaded'] })
  return () => {
    observer.disconnect()
    window.clearTimeout(timer)
  }
}
