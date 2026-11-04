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
