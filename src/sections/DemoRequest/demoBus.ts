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
  /** a dealer page's "plan a demo here": the dealer's slug, pre-selected in the form */
  dealer?: string
}

/**
 * A request made while no form is listening — from another page, before the
 * landing page (and its demo form) has been shown — is held and handed to the
 * form as soon as it mounts.
 */
let pending: Detail | null = null
let listeners = 0

export function requestDemo(modelId: string | null, message?: string, dealer?: string): void {
  const detail = { modelId, message, dealer }
  if (listeners === 0) {
    pending = detail
    return
  }
  window.dispatchEvent(new CustomEvent<Detail>(EVENT, { detail }))
}

export function onDemoRequest(
  handler: (modelId: string | null, message?: string, dealer?: string) => void,
): () => void {
  const listener = (e: Event) => {
    const { modelId, message, dealer } = (e as CustomEvent<Detail>).detail
    handler(modelId, message, dealer)
  }
  window.addEventListener(EVENT, listener)
  listeners += 1
  if (pending) {
    const { modelId, message, dealer } = pending
    pending = null
    handler(modelId, message, dealer)
  }
  return () => {
    window.removeEventListener(EVENT, listener)
    listeners -= 1
  }
}
