/**
 * The complete model catalogue of solistractor.nl/modellen, as published
 * (catalogue.json, rebuilt by scripts/scrape-catalogue.py), and the engine
 * that runs each model's configurator from it.
 *
 * The configurator definitions are the site's own: the same options, prices,
 * and rules (`when` — is this available; `priceRule` / `labelRule` — if this,
 * then that price or label). The rule language is Dutch because the source
 * is: a condition is { veld, op, waarde | waarden } with op one of
 *   is · isNiet · isEenVan · gezet · nietGezet
 * and a rule is { indien: <condition>, dan: <value>, anders: <value> }.
 *
 * The JSON is loaded on demand (`loadCatalogue`) — it is only needed once a
 * model sheet opens, so it stays out of the first page load.
 */

export type Op = 'is' | 'isNiet' | 'isEenVan' | 'gezet' | 'nietGezet'

export interface Condition {
  veld: string
  op: Op
  waarde?: string
  waarden?: string[]
}

export interface Rule<T> {
  indien: Condition
  dan: T
  anders: T
}

interface Priced {
  label?: string
  note?: string
  price?: number | null
  priceRule?: Rule<number>
  labelRule?: Rule<string>
  onRequest?: boolean
  when?: Condition
  /** shown when `when` does not hold: how to make this available */
  rule?: string
}

export interface ConfigOption extends Priced {
  value: string
  label: string
  detail?: string
  isDefault?: boolean
  image?: string
}

export type ControlType = 'cards' | 'list' | 'select' | 'check' | 'quantity' | 'auto'

export interface ConfigControl extends Priced {
  key: string
  type: ControlType
  max?: number
  unit?: string
  /** only shown once `when` holds, rather than shown disabled */
  hidden?: boolean
  options: ConfigOption[]
}

export interface ConfigStep {
  title: string
  controls: ConfigControl[]
}

export interface Configurator {
  eyebrow: string
  currency: string
  vat: boolean
  priceDate: string
  steps: ConfigStep[]
}

export interface LabelValue {
  label: string
  value: string
}

export interface CatalogueModel {
  slug: string
  url: string
  category: string
  tagline: string
  width: string
  hero: { eyebrow: string; headline: string; text: string }
  keyFacts: LabelValue[]
  intro: { eyebrow: string; title: string; text: string; checks: string[]; footnote: string; image: string }
  work: { eyebrow: string; title: string; text: string; items: { title: string; text: string }[] }
  specsNote: string
  specs: LabelValue[]
  downloads: { label: string; meta: string; href: string }[]
  configuratorNote: string
  configurator: Configurator
}

export interface CatalogueFile {
  source: string
  retrieved: string
  note: string
  models: CatalogueModel[]
}

let pending: Promise<CatalogueFile> | null = null

/** The catalogue, fetched once as its own chunk the first time it is needed. */
export function loadCatalogue(): Promise<CatalogueFile> {
  pending ??= import('./catalogue.json').then((m) => m.default as unknown as CatalogueFile)
  return pending
}

/* The engine ----------------------------------------------------------------- */

export type Selection = Record<string, string | boolean | number>

function isSet(v: Selection[string] | undefined): boolean {
  if (typeof v === 'number') return v > 0
  if (typeof v === 'string') return v !== '' && v !== 'none' && v !== '0'
  return v === true
}

export function holds(c: Condition | undefined, sel: Selection): boolean {
  if (!c) return true
  const v = sel[c.veld]
  switch (c.op) {
    case 'is':
      return String(v) === c.waarde
    case 'isNiet':
      return String(v) !== c.waarde
    case 'isEenVan':
      return (c.waarden ?? []).includes(String(v))
    case 'gezet':
      return isSet(v)
    case 'nietGezet':
      return !isSet(v)
    default:
      return true
  }
}

export function priceOf(item: Priced, sel: Selection): number | null {
  if (item.priceRule) return holds(item.priceRule.indien, sel) ? item.priceRule.dan : item.priceRule.anders
  return item.price ?? null
}

export function labelOf(item: Priced, sel: Selection): string {
  if (item.labelRule) return holds(item.labelRule.indien, sel) ? item.labelRule.dan : item.labelRule.anders
  return item.label ?? ''
}

const CHOICE: ControlType[] = ['cards', 'list', 'select']

export function isChoice(c: ConfigControl): boolean {
  return CHOICE.includes(c.type)
}

function defaultFor(c: ConfigControl, sel: Selection): Selection[string] {
  if (isChoice(c)) {
    const available = c.options.filter((o) => holds(o.when, sel))
    return (available.find((o) => o.isDefault) ?? available[0] ?? c.options[0])?.value ?? ''
  }
  return c.type === 'quantity' ? 0 : false
}

function controls(cfg: Configurator): ConfigControl[] {
  return cfg.steps.flatMap((s) => s.controls)
}

/**
 * Makes a selection consistent with the rules: anything that is no longer
 * available falls back to its default. Controls depend on earlier ones (the
 * version decides the loader, the loader decides its extras), so a couple of
 * passes settle every chain in the catalogue.
 */
export function normalize(cfg: Configurator, sel: Selection): Selection {
  const next: Selection = { ...sel }
  for (let pass = 0; pass < 3; pass += 1) {
    for (const c of controls(cfg)) {
      if (c.type === 'auto') continue
      if (!(c.key in next)) next[c.key] = defaultFor(c, next)
      if (!holds(c.when, next)) {
        next[c.key] = defaultFor(c, next)
        continue
      }
      if (isChoice(c)) {
        const current = c.options.find((o) => o.value === next[c.key])
        if (!current || !holds(current.when, next)) next[c.key] = defaultFor(c, next)
      }
      if (c.type === 'quantity') next[c.key] = Math.min(Math.max(Number(next[c.key]) || 0, 0), c.max ?? 9)
    }
  }
  return next
}

export function initialSelection(cfg: Configurator): Selection {
  return normalize(cfg, {})
}

export interface SummaryLine {
  key: string
  label: string
  /** null: no price published for this item */
  price: number | null
  onRequest: boolean
}

/** The configuration as priced lines, in the configurator's own order. */
export function summarize(cfg: Configurator, sel: Selection): { lines: SummaryLine[]; total: number; hasOnRequest: boolean } {
  const lines: SummaryLine[] = []
  for (const c of controls(cfg)) {
    if (!holds(c.when, sel)) continue
    if (isChoice(c)) {
      const o = c.options.find((x) => x.value === sel[c.key])
      if (!o) continue
      const price = priceOf(o, sel)
      // Default "none"/standard choices at no cost add nothing worth listing,
      // except the version itself and the tyres, which are always stated.
      const always = c.key === 'base' || c.key === 'tires'
      if (!always && !price && o.isDefault) continue
      lines.push({ key: c.key, label: labelOf(o, sel), price, onRequest: !!o.onRequest && price === null })
    } else if (c.type === 'check') {
      if (sel[c.key] !== true) continue
      const price = priceOf(c, sel)
      lines.push({ key: c.key, label: labelOf(c, sel), price, onRequest: !!c.onRequest && price === null })
    } else if (c.type === 'quantity') {
      const n = Number(sel[c.key]) || 0
      if (!n) continue
      const unit = priceOf(c, sel)
      lines.push({
        key: c.key,
        label: `${labelOf(c, sel)} · ${n}×`,
        price: unit === null ? null : unit * n,
        onRequest: !!c.onRequest && unit === null,
      })
    } else if (c.type === 'auto') {
      const price = priceOf(c, sel)
      lines.push({ key: c.key, label: labelOf(c, sel), price, onRequest: !!c.onRequest && price === null })
    }
  }
  const total = lines.reduce((sum, l) => sum + (l.price ?? 0), 0)
  return { lines, total, hasOnRequest: lines.some((l) => l.onRequest) }
}
