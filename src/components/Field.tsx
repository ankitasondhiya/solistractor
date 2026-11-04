import { cloneElement, useId, type ReactElement, type ReactNode } from 'react'

/**
 * A labelled control. Its error, when there is one, sits right under it and
 * is tied to the control with aria-describedby, so a screen reader reads the
 * problem together with the field — as is a persistent hint (ui-ux-pro-max:
 * input-helper-text) and the "optional" / "required" tag beside the label.
 */
export function Field({
  label,
  tag,
  hint,
  error,
  wide = false,
  children,
}: {
  label: string
  /** "optioneel", "verplicht" */
  tag?: string
  hint?: ReactNode
  error?: string
  wide?: boolean
  children: ReactElement<{ 'aria-describedby'?: string }>
}) {
  const errorId = useId()
  const hintId = useId()
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined
  return (
    <label className="field" data-wide={wide ? 'true' : 'false'} data-error={error ? 'true' : 'false'}>
      <span className="field__label">
        {label}
        {tag && <span className="field__tag"> · {tag}</span>}
      </span>
      {cloneElement(children, { 'aria-describedby': describedBy })}
      {hint && (
        <span className="field__hint" id={hintId}>
          {hint}
        </span>
      )}
      {error && (
        <span className="field__error" id={errorId} role="alert">
          {error}
        </span>
      )}
    </label>
  )
}
