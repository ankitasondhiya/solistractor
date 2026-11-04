import { useRef, useState, type FormEvent } from 'react'

import { useLanguage } from '../i18n/LanguageContext'
import { links } from '../data/links'
import { Field } from '../components/Field'
import { ArrowRight, Check } from '../components/Icons'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

type Key = 'firstName' | 'lastName' | 'email' | 'message' | 'consent'

/** "?onderwerp=dealer" (the "Dealer worden" links) pre-selects that subject. */
function presetSubject(subjects: string[]): string {
  const wanted = new URLSearchParams(window.location.search).get('onderwerp')
  if (wanted === 'dealer') return subjects.find((s) => /dealer/i.test(s)) ?? subjects[0] ?? ''
  if (wanted === 'garantie') return subjects.find((s) => /garantie/i.test(s)) ?? subjects[0] ?? ''
  return subjects[0] ?? ''
}

/**
 * The contact form of solistractor.nl, on this site. There is no backend
 * here, so — like the demo request — sending opens the reader's own email app
 * with the message written out to info@solistractor.nl; nothing leaves
 * without them pressing send. Fields are checked when the reader leaves them,
 * a failed send puts focus on the first problem, and each error sits under
 * its field (ui-ux-pro-max: inline-validation, error-placement).
 */
export function ContactForm({ subjects }: { subjects: string[] }) {
  const { t } = useLanguage()
  const c = t.pages.contact
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: presetSubject(subjects),
    message: '',
    consent: false,
  })
  const [errors, setErrors] = useState<Partial<Record<Key, string>>>({})
  const [sent, setSent] = useState(false)
  const touched = useRef(new Set<Key>())
  const formRef = useRef<HTMLFormElement>(null)

  const problem = (key: Key, f = form): string | undefined => {
    if (key === 'firstName') return f.firstName.trim() ? undefined : c.errors.firstName
    if (key === 'lastName') return f.lastName.trim() ? undefined : c.errors.lastName
    if (key === 'email') return EMAIL.test(f.email.trim()) ? undefined : c.errors.email
    if (key === 'message') return f.message.trim() ? undefined : c.errors.message
    return f.consent ? undefined : c.errors.consent
  }

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    const next = { ...form, [key]: value }
    setForm(next)
    if (errors[key as Key]) setErrors((e) => ({ ...e, [key]: problem(key as Key, next) }))
  }

  const blur = (key: Key) => {
    touched.current.add(key)
    setErrors((e) => ({ ...e, [key]: problem(key) }))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const keys: Key[] = ['firstName', 'lastName', 'email', 'message', 'consent']
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
    const name = `${form.firstName.trim()} ${form.lastName.trim()}`
    const lines: string[] = [
      `${c.firstName}: ${form.firstName}`,
      `${c.lastName}: ${form.lastName}`,
      `${c.email}: ${form.email}`,
    ]
    if (form.phone) lines.push(`${c.phone}: ${form.phone}`)
    lines.push(`${c.subject} ${form.subject}`, '', form.message)
    const body = lines.join('\n')
    window.location.href = `${links.email}?subject=${encodeURIComponent(`${form.subject} — ${name}`)}&body=${encodeURIComponent(body)}`
    setSent(true)
  }

  if (sent) {
    return (
      <div className="cp-sent" role="status">
        <span className="cp-sent__icon">
          <Check />
        </span>
        <h3 className="display">{c.sentTitle}</h3>
        <p>{c.sentBody}</p>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => {
            setSent(false)
            setForm((f) => ({ ...f, message: '' }))
          }}
        >
          {c.again}
        </button>
      </div>
    )
  }

  return (
    <form ref={formRef} className="cp-fields" onSubmit={submit} noValidate>
      <Field label={c.firstName} error={errors.firstName}>
        <input
          autoComplete="given-name"
          value={form.firstName}
          onChange={(e) => set('firstName', e.target.value)}
          onBlur={() => blur('firstName')}
          aria-required="true"
          aria-invalid={!!errors.firstName}
        />
      </Field>
      <Field label={c.lastName} error={errors.lastName}>
        <input
          autoComplete="family-name"
          value={form.lastName}
          onChange={(e) => set('lastName', e.target.value)}
          onBlur={() => blur('lastName')}
          aria-required="true"
          aria-invalid={!!errors.lastName}
        />
      </Field>
      <Field label={c.email} error={errors.email}>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          onBlur={() => blur('email')}
          aria-required="true"
          aria-invalid={!!errors.email}
        />
      </Field>
      <Field label={c.phone}>
        <input type="tel" autoComplete="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
      </Field>
      <Field label={c.subject} wide>
        <select value={form.subject} onChange={(e) => set('subject', e.target.value)}>
          {subjects.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </Field>
      <Field label={c.message} error={errors.message} wide>
        <textarea
          rows={5}
          value={form.message}
          onChange={(e) => set('message', e.target.value)}
          onBlur={() => blur('message')}
          aria-required="true"
          aria-invalid={!!errors.message}
        />
      </Field>
      <div className="cp-consent field" data-wide="true" data-error={errors.consent ? 'true' : 'false'}>
        <label className="cp-check">
          <input
            type="checkbox"
            checked={form.consent}
            onChange={(e) => set('consent', e.target.checked)}
            aria-required="true"
            aria-invalid={!!errors.consent}
            aria-describedby={errors.consent ? 'consent-error' : undefined}
          />
          <span>
            {c.consent} <a href={links.privacy}>{c.privacy}</a>.
          </span>
        </label>
        {errors.consent && (
          <span className="field__error" id="consent-error" role="alert">
            {errors.consent}
          </span>
        )}
      </div>
      <p className="cp-fields__note">{c.mailNote}</p>
      <div className="cp-fields__actions">
        <button type="submit" className="btn">
          {c.submit}
          <ArrowRight className="btn__icon" />
        </button>
      </div>
    </form>
  )
}
