/**
 * Lets any section hand a model to the demo form — "Plan een demonstratie"
 * under a recommendation arrives with that tractor already chosen, and the
 * configurator's "take to a quote" arrives with the configuration written
 * into the comments. A DOM event rather than lifted state: the sections are
 * siblings that otherwise know nothing about each other.
 */
const EVENT = 'solis:demo-model'

interface Detail {
  modelId: string | null
  message?: string
}

export function requestDemo(modelId: string | null, message?: string): void {
  window.dispatchEvent(new CustomEvent<Detail>(EVENT, { detail: { modelId, message } }))
}

export function onDemoRequest(handler: (modelId: string | null, message?: string) => void): () => void {
  const listener = (e: Event) => {
    const { modelId, message } = (e as CustomEvent<Detail>).detail
    handler(modelId, message)
  }
  window.addEventListener(EVENT, listener)
  return () => window.removeEventListener(EVENT, listener)
}
