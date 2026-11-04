/** Opens the shortlist comparison from the tray, the phone action bar or anywhere else. */
const EVENT = 'solis:compare'

export function openCompare(): void {
  window.dispatchEvent(new CustomEvent(EVENT))
}

export function onCompare(handler: () => void): () => void {
  window.addEventListener(EVENT, handler)
  return () => window.removeEventListener(EVENT, handler)
}
