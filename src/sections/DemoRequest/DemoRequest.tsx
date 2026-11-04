import { cloneElement, useEffect, useId, useRef, useState, type FormEvent, type ReactElement } from 'react'
import './demo-request.css'

import { useLanguage } from '../../i18n/LanguageContext'
import { models, type Use } from '../../data/models'
import { byDistance, dealers, provinces, type Province } from '../../data/dealers'
import { usePersonal } from '../../personal/personal'
import { links } from '../../data/links'
import { ArrowLeft, ArrowRight, Check, Mail, Phone } from '../../components/Icons'
import { onDemoRequest } from './demoBus'

interface FormState {
  name: string
  email: string
  phone: string
  place: string
  model: string | null
  use: Use | ''
  province: Province | ''
  dealer: string
  message: string
}

const EMPTY: FormState = {
  name: '',
  email: '',
  phone: '',
  place: '',
  model: null,
  use: '',
  province: '',
  dealer: '',
  message: '',
}

const USES: Use[] = ['yard', 'grounds', 'equestrian', 'orchard', 'farming', 'loader']
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

type Required = 'name' | 'email' | 'place'
type Personal = ReturnType<typeof usePersonal>

/**
 * Fills what the reader already told the page — the tractor they last opened,
 * their town and nearest dealer — into the fields they haven't touched. An
 * untouched field keeps following their latest choice (a new location, another
 * model); one they typed in or picked is theirs and is never overwritten
 * (ui-ux-pro-max: redundant-entry).
 */
function withPrefill(f: FormState, personal: Personal, touched: Set<keyof FormState>): FormState {
  const next = { ...f }
  if (!touched.has('model')) next.model = personal.viewed[0] ?? null
  if (!touched.has('place')) next.place = personal.place?.town ?? ''
  if (!touched.has('province') && !touched.has('dealer')) {
    const near = personal.place ? byDistance(personal.place)[0]?.dealer : undefined
    next.province = near?.province ?? ''
    next.dealer = near ? `${near.name}, ${near.town}` : ''
  }
  const same = (Object.keys(next) as (keyof FormState)[]).every((k) => next[k] === f[k])
  return same ? f : next
}

/**
 * Section 08 — a demo request in three short steps (after Enki's Web Studio's
 * contact form). There is no backend behind this page, so the last step
 * opens the reader's own email app with the request written out, addressed
 * to Solis Nederland — nothing is sent anywhere without them pressing send.
 */
export function DemoRequest() {
  const { t, lang } = useLanguage()
  const d = t.demo
  const personal = usePersonal()
  const touched = useRef(new Set<keyof FormState>())
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(() => withPrefill(EMPTY, personal, touched.current))
  const [errors, setErrors] = useState<Partial<Record<Required, string>>>({})
  const [sent, setSent] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(
    () =>
      onDemoRequest((modelId, message) => {
        if (modelId) touched.current.add('model')
        setForm((f) => ({ ...f, model: modelId ?? f.model, message: message ?? f.message }))
      }),
    [],
  )

  // What the reader does elsewhere on the page (opens a model, finds their
  // dealer) reaches the form while its fields are still untouched.
  useEffect(() => {
    setForm((f) => withPrefill(f, personal, touched.current))
  }, [personal])

  const prefilled =
    (!touched.current.has('model') && form.model !== null) ||
    (!touched.current.has('place') && !!form.place) ||
    (!touched.current.has('dealer') && !touched.current.has('province') && !!form.dealer)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    touched.current.add(key)
    setForm((f) => ({ ...f, [key]: value }))
  }

  const problem = (key: Required, f: FormState): string | undefined => {
    if (key === 'name') return f.name.trim() ? undefined : d.errors.name
    if (key === 'email') return EMAIL.test(f.email.trim()) ? undefined : d.errors.email
    return f.place.trim() ? undefined : d.errors.place
  }

  // Checked when the reader leaves a field they typed in, not on every key
  // (ui-ux-pro-max: inline-validation); a shown error clears as soon as it's fixed.
  const checkOnBlur = (key: Required) => {
    if (!touched.current.has(key)) return
    setErrors((e) => ({ ...e, [key]: problem(key, form) }))
  }

  const setRequired = (key: Required, value: string) => {
    set(key, value)
    if (errors[key]) setErrors((e) => ({ ...e, [key]: problem(key, { ...form, [key]: value }) }))
  }

  const validateFirst = () => {
    const next: typeof errors = {}
    for (const key of ['name', 'email', 'place'] as Required[]) {
      const p = problem(key, form)
      if (p) next[key] = p
    }
    setErrors(next)
    const ok = Object.keys(next).length === 0
    // A failed step puts the reader on the first field to fix, once the
    // error messages have rendered.
    if (!ok) window.setTimeout(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0)
    return ok
  }

  const next = () => {
    if (step === 0 && !validateFirst()) return
    setStep((s) => Math.min(s + 1, 2))
  }

  const modelName = models.find((m) => m.id === form.model)?.fullName ?? d.unsure
  const inRegion = form.province ? dealers.filter((x) => x.province === form.province) : []
  // Nearest first, with the distance, once the reader has said where they are.
  const regionDealers = personal.place
    ? byDistance(personal.place, inRegion)
    : inRegion.map((dealer) => ({ dealer, km: null as number | null }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (step < 2) {
      next()
      return
    }
    if (!validateFirst()) {
      setStep(0)
      return
    }
    const L = d.mailLabels
    const lines = [
      `${L.name}: ${form.name}`,
      `${L.email}: ${form.email}`,
      form.phone && `${L.phone}: ${form.phone}`,
      `${L.place}: ${form.place}`,
      `${L.model}: ${modelName}`,
      form.use && `${L.use}: ${t.finder.uses[form.use]}`,
      form.province && `${L.province}: ${form.province}`,
      form.dealer && `${L.dealer}: ${form.dealer}`,
      form.message && `\n${L.message}:\n${form.message}`,
    ].filter(Boolean)
    const href = `${links.email}?subject=${encodeURIComponent(d.subject(modelName))}&body=${encodeURIComponent(lines.join('\n'))}`
    window.location.href = href
    setSent(true)
  }

  return (
    <section className="section demo" id="demo" aria-labelledby="demo-title">
      <div className="container demo__grid">
        <div className="demo__intro">
          <p className="eyebrow eyebrow--light">{d.eyebrow}</p>
          <h2 id="demo-title" className="display demo__title">
            {d.title.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h2>
          <p className="lead">{d.lead}</p>
          <div className="demo__direct">
            <p>{d.direct}</p>
            <a href={links.phone}>
              <Phone />
              {d.call} {t.utility.phone}
            </a>
            <a href={links.email}>
              <Mail />
              {d.mail} info@solistractor.nl
            </a>
          </div>
        </div>

        <div className="demo__card">
          {sent ? (
            <div className="demo__sent">
              <span className="demo__sent-icon">
                <Check />
              </span>
              <h3 className="display">{d.sentTitle}</h3>
              <p>{d.sentBody}</p>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setSent(false)
                  setStep(0)
                  touched.current.clear()
                  setForm(withPrefill(EMPTY, personal, touched.current))
                }}
              >
                {d.again}
              </button>
            </div>
          ) : (
            <form ref={formRef} onSubmit={submit} noValidate>
              <ol className="demo__steps">
                {d.steps.map((label, i) => (
                  <li key={label} data-state={i === step ? 'active' : i < step ? 'done' : 'todo'}>
                    <span>{i < step ? <Check /> : i + 1}</span>
                    {label}
                  </li>
                ))}
              </ol>
              <p className="demo__step-of" aria-live="polite">
                {d.stepOf(step + 1, 3)}
              </p>
              {prefilled && <p className="demo__prefilled">{d.prefilled}</p>}

              {step === 0 && (
                <div className="demo__fields" key="s0">
                  <Field label={d.name} error={errors.name}>
                    <input
                      autoComplete="name"
                      value={form.name}
                      onChange={(e) => setRequired('name', e.target.value)}
                      onBlur={() => checkOnBlur('name')}
                      aria-required="true"
                      aria-invalid={!!errors.name}
                    />
                  </Field>
                  <Field label={d.email} error={errors.email}>
                    <input
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      spellCheck={false}
                      value={form.email}
                      onChange={(e) => setRequired('email', e.target.value)}
                      onBlur={() => checkOnBlur('email')}
                      aria-required="true"
                      aria-invalid={!!errors.email}
                    />
                  </Field>
                  <Field label={d.phone}>
                    <input type="tel" autoComplete="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                  </Field>
                  <Field label={d.place} error={errors.place}>
                    <input
                      autoComplete="address-level2"
                      value={form.place}
                      onChange={(e) => setRequired('place', e.target.value)}
                      onBlur={() => checkOnBlur('place')}
                      aria-required="true"
                      aria-invalid={!!errors.place}
                    />
                  </Field>
                </div>
              )}

              {step === 1 && (
                <div className="demo__fields" key="s1">
                  <fieldset className="demo__models">
                    <legend>{d.model}</legend>
                    <div>
                      {models.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          className="chip"
                          aria-pressed={form.model === m.id}
                          onClick={() => set('model', m.id)}
                        >
                          {m.name}
                          <small>
                            {m.hp} {lang === 'nl' ? 'pk' : 'hp'}
                          </small>
                        </button>
                      ))}
                      <button type="button" className="chip" aria-pressed={form.model === null} onClick={() => set('model', null)}>
                        {d.unsure}
                      </button>
                    </div>
                  </fieldset>
                  <Field label={d.use}>
                    <select value={form.use} onChange={(e) => set('use', e.target.value as Use | '')}>
                      <option value="">—</option>
                      {USES.map((u) => (
                        <option key={u} value={u}>
                          {t.finder.uses[u]}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              )}

              {step === 2 && (
                <div className="demo__fields" key="s2">
                  <Field label={d.province}>
                    <select
                      value={form.province}
                      onChange={(e) => {
                        touched.current.add('province')
                        setForm((f) => ({ ...f, province: e.target.value as Province | '', dealer: '' }))
                      }}
                    >
                      <option value="">{d.anyProvince}</option>
                      {provinces.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={d.dealer}>
                    <select value={form.dealer} onChange={(e) => set('dealer', e.target.value)} disabled={!form.province}>
                      <option value="">{d.anyDealer}</option>
                      {regionDealers.map(({ dealer: x, km }) => (
                        <option key={x.href} value={`${x.name}, ${x.town}`}>
                          {x.name} — {x.town}
                          {km !== null ? ` (${t.dealers.locate.km(km)})` : ''}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={d.message} wide>
                    <textarea rows={3} value={form.message} onChange={(e) => set('message', e.target.value)} />
                  </Field>
                  <p className="demo__note">{d.mailNote}</p>
                </div>
              )}

              <div className="demo__actions">
                {step > 0 && (
                  <button type="button" className="btn btn--ghost" onClick={() => setStep((s) => s - 1)}>
                    <ArrowLeft className="btn__icon" />
                    {d.back}
                  </button>
                )}
                <button type="submit" className="btn">
                  {step < 2 ? d.next : d.submit}
                  <ArrowRight className="btn__icon" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

/**
 * A labelled control. Its error, when there is one, sits right under it and
 * is tied to the control with aria-describedby, so a screen reader reads the
 * problem together with the field.
 */
function Field({
  label,
  error,
  wide = false,
  children,
}: {
  label: string
  error?: string
  wide?: boolean
  children: ReactElement<{ 'aria-describedby'?: string }>
}) {
  const errorId = useId()
  return (
    <label className="field" data-wide={wide ? 'true' : 'false'} data-error={error ? 'true' : 'false'}>
      <span className="field__label">{label}</span>
      {cloneElement(children, { 'aria-describedby': error ? errorId : undefined })}
      {error && (
        <span className="field__error" id={errorId} role="alert">
          {error}
        </span>
      )}
    </label>
  )
}
