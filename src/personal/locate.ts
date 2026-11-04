import type { Place } from './personal'

/**
 * Finding where the reader is, two ways, both on their initiative:
 *
 *  - "Use my location": the browser asks their permission (Geolocation API).
 *  - A postcode or town, looked up with PDOK Locatieserver — the Dutch
 *    government's free address service (no key, CORS open).
 *
 * Deliberately not an IP lookup: in the Netherlands that mostly lands on the
 * provider's hub rather than the reader's town, and it would send every
 * visitor's address to a third party without asking.
 */

const PDOK = 'https://api.pdok.nl/bzk/locatieserver/search/v3_1'

export type LocateError = 'denied' | 'unavailable' | 'notfound' | 'network'

export class LocateFailure extends Error {
  constructor(public reason: LocateError) {
    super(reason)
  }
}

interface PdokDoc {
  type: 'postcode' | 'woonplaats' | 'gemeente'
  centroide_ll: string
  woonplaatsnaam?: string
  gemeentenaam?: string
  postcode?: string
}

/** "POINT(5.389 52.155)" → { lat, lng } */
function point(wkt: string): { lat: number; lng: number } | null {
  const m = /POINT\(([-\d.]+) ([-\d.]+)\)/.exec(wkt)
  if (!m) return null
  return { lng: Number(m[1]), lat: Number(m[2]) }
}

/** About a kilometre of precision is plenty for "nearest dealer"; keep no more. */
const coarse = (n: number) => Math.round(n * 100) / 100

const POSTCODE = /^(\d{4})\s*([a-z]{2})?$/i

export async function searchPlace(query: string, signal?: AbortSignal): Promise<Place> {
  const q = query.trim()
  if (!q) throw new LocateFailure('notfound')
  const params = new URLSearchParams({
    q,
    fq: 'type:(postcode OR woonplaats OR gemeente)',
    rows: '1',
    fl: 'type,centroide_ll,woonplaatsnaam,gemeentenaam,postcode',
  })
  let doc: PdokDoc | undefined
  try {
    const res = await fetch(`${PDOK}/free?${params}`, { signal })
    if (!res.ok) throw new Error(String(res.status))
    const json = (await res.json()) as { response?: { docs?: PdokDoc[] } }
    doc = json.response?.docs?.[0]
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e
    throw new LocateFailure('network')
  }
  const at = doc && point(doc.centroide_ll)
  if (!doc || !at) throw new LocateFailure('notfound')

  const town = doc.woonplaatsnaam ?? doc.gemeentenaam ?? null
  // Echo a postcode the way the reader typed it ("3811 AB" or "3811"), then the town.
  const pc = POSTCODE.exec(q)
  const label = pc ? [pc[1], pc[2]?.toUpperCase(), town].filter(Boolean).join(' ') : town ?? q
  return { label, town, lat: at.lat, lng: at.lng, source: 'search' }
}

/** The town at a point, for a readable label; null when the lookup fails. */
async function townAt(lat: number, lng: number): Promise<string | null> {
  try {
    const params = new URLSearchParams({ lat: String(lat), lon: String(lng), type: 'woonplaats', rows: '1', fl: 'woonplaatsnaam' })
    const res = await fetch(`${PDOK}/reverse?${params}`)
    if (!res.ok) return null
    const json = (await res.json()) as { response?: { docs?: { woonplaatsnaam?: string }[] } }
    return json.response?.docs?.[0]?.woonplaatsnaam ?? null
  } catch {
    return null
  }
}

export function locateMe(fallbackLabel: string): Promise<Place> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new LocateFailure('unavailable'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = coarse(pos.coords.latitude)
        const lng = coarse(pos.coords.longitude)
        const town = await townAt(lat, lng)
        resolve({ label: town ?? fallbackLabel, town, lat, lng, source: 'gps' })
      },
      (err) => reject(new LocateFailure(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable')),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 },
    )
  })
}
