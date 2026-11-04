import { useMemo, useSyncExternalStore } from 'react'

import { recommend, type Space, type Use } from '../data/models'

/**
 * What the page remembers about one reader, so a second visit picks up where
 * the first left off: where they are (to sort the dealers), which tractors
 * they opened, and what they told the model finder.
 *
 * Kept in this browser only (localStorage) — nothing is sent anywhere, there
 * is no profile and no tracking, and "Forget my choices" in the footer wipes
 * it. Every read and write is guarded: private windows and blocked site data
 * simply mean the page starts fresh each time.
 */

export interface Place {
  /** what the reader sees: "3811 AB Amersfoort", "Zwolle", "Uw locatie" */
  label: string
  /** the town, for pre-filling the demo form's "place" field */
  town: string | null
  lat: number
  lng: number
  source: 'gps' | 'search'
}

export interface FinderAnswers {
  use: Use
  space: Space | null
}

interface PersonalState {
  place: Place | null
  /** model ids, most recently opened first */
  viewed: string[]
  finder: FinderAnswers | null
  /** visits so far, this one included */
  visits: number
  /** whether this visit started with something to come back to */
  returning: boolean
}

const KEY = 'solis-personal'
const SESSION_KEY = 'solis-session'
/** Every key the site writes, for "Forget my choices". */
const ALL_KEYS = [KEY, 'solis-lang', 'solis-motion-paused']
const MAX_VIEWED = 4

const EMPTY: PersonalState = { place: null, viewed: [], finder: null, visits: 0, returning: false }

function read(): PersonalState {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return { ...EMPTY }
    const parsed = JSON.parse(raw) as Partial<PersonalState>
    return {
      place: parsed.place && typeof parsed.place.lat === 'number' ? parsed.place : null,
      viewed: Array.isArray(parsed.viewed) ? parsed.viewed.filter((v) => typeof v === 'string').slice(0, MAX_VIEWED) : [],
      finder: parsed.finder && typeof parsed.finder.use === 'string' ? parsed.finder : null,
      visits: typeof parsed.visits === 'number' ? parsed.visits : 0,
      returning: false,
    }
  } catch {
    return { ...EMPTY }
  }
}

function write(next: PersonalState): void {
  try {
    const { returning: _returning, ...stored } = next
    window.localStorage.setItem(KEY, JSON.stringify(stored))
  } catch {
    // Not remembered, but this visit still uses it.
  }
}

/** Counts a visit once per browser session, not on every reload. */
function startSession(state: PersonalState): PersonalState {
  let fresh = true
  try {
    fresh = window.sessionStorage.getItem(SESSION_KEY) === null
    window.sessionStorage.setItem(SESSION_KEY, '1')
  } catch {
    // Without session storage every load counts as a visit; harmless.
  }
  if (!fresh) return state
  const returning = state.visits > 0 && (state.viewed.length > 0 || state.place !== null)
  const next = { ...state, visits: state.visits + 1, returning }
  write(next)
  return next
}

let state: PersonalState = startSession(read())
const listeners = new Set<() => void>()

function update(patch: Partial<PersonalState>): void {
  state = { ...state, ...patch }
  write(state)
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function usePersonal(): PersonalState {
  return useSyncExternalStore(subscribe, () => state)
}

/** The models the reader's own finder answers point to, best first. */
export function useMatchIds(): string[] {
  const { finder } = usePersonal()
  return useMemo(() => (finder ? recommend(finder.use, finder.space).map((r) => r.model.id) : []), [finder])
}

export function getPersonal(): PersonalState {
  return state
}

export function setPlace(place: Place | null): void {
  update({ place })
}

export function recordView(modelId: string): void {
  update({ viewed: [modelId, ...state.viewed.filter((id) => id !== modelId)].slice(0, MAX_VIEWED) })
}

export function setFinderAnswers(finder: FinderAnswers | null): void {
  update({ finder })
}

/** The welcome-back prompt was answered or closed: don't show it again this visit. */
export function dismissReturning(): void {
  if (state.returning) update({ returning: false })
}

/** Wipes everything the site remembers in this browser. */
export function forgetEverything(): void {
  try {
    ALL_KEYS.forEach((k) => window.localStorage.removeItem(k))
  } catch {
    // Nothing could be stored in the first place.
  }
  state = { ...EMPTY, visits: 1 }
  write(state)
  listeners.forEach((l) => l())
}

/* Distance ----------------------------------------------------------------- */

/** Straight-line distance in km between two points (haversine). */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
