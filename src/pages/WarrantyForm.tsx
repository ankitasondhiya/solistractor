import { useRef, useState, type FormEvent } from 'react'

import { useLanguage } from '../i18n/LanguageContext'
import { links } from '../data/links'
import { dealers } from '../data/dealers'
import { models } from '../data/models'
import { Field } from '../components/Field'
import { ArrowRight, Check } from '../components/Icons'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
/** RDW Open Data — the Dutch vehicle register (public, CORS open). */
const RDW = 'https://opendata.rdw.nl/resource/m9d7-ebf2.json'

type Key = 'owner' | 'email' | 'phone' | 'dealer' | 'model' | 'serial' | 'date' | 'hours'
type Plate = { state: 'idle' | 'looking' | 'found' | 'other' | 'missing' | 'offline'; name?: string }

/**
 * The warranty registration of solistractor.nl, on this site. As on the
 * original, the registration number fills in the model — looked up in the
 * RDW's public register when the reader leaves the field. Without a backend
 * the registration is sent from the reader's own email app, with the proof of
 * purchase attached there (the form says so before and after).
 */
export function WarrantyForm() {
  const { t } = useLanguage()
  const w = t.pages.warranty
  const [form, setForm] = useState({
    owner: '',
    email: '',
    phone: '',
    dealer: '',
    plate: '',
    model: '',
    serial: '',
    date: '',
    hours: '',
  })
  const [errors, setErrors] = useState<Partial<Record<Key, string>>>({})
  const [plate, setPlate] = useState<Plate>({ state: 'idle' })
  const [sent, setSent] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const lookup = useRef<AbortController | null>(null)

  const problem = (key: Key, f = form): string | undefined => {
    const v = f[key].trim()
    if (key === 'email') return EMAIL.test(v) ? undefined : w.errors.email
    return v ? undefined : w.errors[key]
  }

  const set = (key: keyof typeof form, value: string) => {
    const next = { ...form, [key]: value }
    setForm(next)
    if (errors[key as Key]) setErrors((e) => ({ ...e, [key]: problem(key as Key, next) }))
  }

  const blur = (key: Key) => setErrors((e) => ({ ...e, [key]: problem(key) }))

  const lookUpPlate = async () => {
    const plateId = form.plate.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (plateId.length < 4) {
      setPlate({ state: 'idle' })
      return
    }
    lookup.current?.abort()
    const ctrl = new AbortController()
    lookup.current = ctrl
    setPlate({ state: 'looking' })
    try {
      const res = await fetch(`${RDW}?kenteken=${encodeURIComponent(plateId)}&$select=merk,handelsbenaming`, {
        signal: ctrl.signal,
      })
      if (!res.ok) throw new Error(String(res.status))
      const rows = (await res.json()) as { merk?: string; handelsbenaming?: string }[]
      const row = rows[0]
      if (!row) {
        setPlate({ state: 'missing' })
        return
      }
      const name = [row.merk, row.handelsbenaming?.replace(new RegExp(`^${row.merk ?? ''}\\s*`, 'i'), '')]
        .filter(Boolean)
        .join(' ')
      if (/solis/i.test(row.merk ?? '')) {
        setPlate({ state: 'found', name })
        setForm((f) => (f.model ? f : { ...f, model: name }))
        setErrors((e) => ({ ...e, model: undefined }))
      } else {
        setPlate({ state: 'other', name })
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setPlate({ state: 'offline' })
    }
  }

  const plateMessage =
    plate.state === 'looking'
      ? w.plateLooking
      : plate.state === 'found'
        ? w.plateFound(plate.name ?? '')
        : plate.state === 'other'
          ? w.plateOther(plate.name ?? '')
          : plate.state === 'missing'
            ? w.plateNotFound
            : plate.state === 'offline'
              ? w.plateOffline
              : null

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const keys: Key[] = ['owner', 'email', 'phone', 'dealer', 'model', 'serial', 'date', 'hours']
    const next: Partial<Record<Key, string>> = {}
    keys.forEach((k) => {
      const p = problem(k)
      if (p) next[k] = p
    })
    setErrors(next)
    if (Object.keys(next).length) {
      window.setTimeout(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0)
      return
    }
    const body = [
      `${w.owner}: ${form.owner}`,
      `${w.email}: ${form.email}`,
      `${w.phone}: ${form.phone}`,
      `${w.dealer}: ${form.dealer}`,
      form.plate && `${w.plate}: ${form.plate.toUpperCase()}`,
      `${w.model}: ${form.model}`,
      `${w.serial}: ${form.serial}`,
      `${w.date}: ${form.date}`,
      `${w.hours}: ${form.hours}`,
      '',
      `${w.proof}: ${w.proofHint}`,
    ]
      .filter(Boolean)
      .join('\n')
    window.location.href = `${links.email}?subject=${encodeURIComponent(w.subject(form.model, form.serial))}&body=${encodeURIComponent(body)}`
    setSent(true)
  }

  if (sent) {
    return (
      <div className="cp-sent" role="status">
        <span className="cp-sent__icon">
          <Check />
        </span>
        <h3 className="display">{w.sentTitle}</h3>
        <p>{w.sentBody}</p>
        <button type="button" className="btn btn--ghost" onClick={() => setSent(false)}>
          {w.again}
        </button>
      </div>
    )
  }

  const req = (key: Key) => ({
    onBlur: () => blur(key),
    'aria-required': true as const,
    'aria-invalid': !!errors[key],
  })

  return (
    <form ref={formRef} className="cp-fields" onSubmit={submit} noValidate>
      <Field label={w.owner} error={errors.owner}>
        <input autoComplete="name" value={form.owner} onChange={(e) => set('owner', e.target.value)} {...req('owner')} />
      </Field>
      <Field label={w.email} error={errors.email}>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          {...req('email')}
        />
      </Field>
      <Field label={w.phone} error={errors.phone}>
        <input type="tel" autoComplete="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} {...req('phone')} />
      </Field>
      <Field label={w.dealer} error={errors.dealer}>
        <select value={form.dealer} onChange={(e) => set('dealer', e.target.value)} {...req('dealer')}>
          <option value="">{w.chooseDealer}</option>
          {dealers.map((d) => (
            <option key={d.href} value={`${d.name} — ${d.town}`}>
              {d.name} — {d.town}
            </option>
          ))}
        </select>
      </Field>
      <Field label={w.plate} tag={w.optional} hint={plateMessage ?? w.plateHint}>
        <input
          autoCapitalize="characters"
          spellCheck={false}
          value={form.plate}
          onChange={(e) => set('plate', e.target.value)}
          onBlur={lookUpPlate}
          placeholder="T-123-AB"
        />
      </Field>
      <Field label={w.model} error={errors.model}>
        <input list="warranty-models" value={form.model} onChange={(e) => set('model', e.target.value)} {...req('model')} />
      </Field>
      <datalist id="warranty-models">
        {models.map((m) => (
          <option key={m.id} value={`Solis ${m.fullName}`} />
        ))}
      </datalist>
      <Field label={w.serial} error={errors.serial}>
        <input spellCheck={false} value={form.serial} onChange={(e) => set('serial', e.target.value)} {...req('serial')} />
      </Field>
      <Field label={w.date} error={errors.date}>
        <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} {...req('date')} />
      </Field>
      <Field label={w.hours} error={errors.hours}>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={form.hours}
          onChange={(e) => set('hours', e.target.value)}
          {...req('hours')}
        />
      </Field>
      <div className="cp-proof" data-wide="true">
        <p className="cp-proof__title">
          {w.proof} <span className="field__tag">· {w.required}</span>
        </p>
        <p>{w.proofHint}</p>
      </div>
      <p className="cp-fields__note">{w.mailNote}</p>
      <div className="cp-fields__actions">
        <button type="submit" className="btn">
          {w.submit}
          <ArrowRight className="btn__icon" />
        </button>
      </div>
    </form>
  )
}
