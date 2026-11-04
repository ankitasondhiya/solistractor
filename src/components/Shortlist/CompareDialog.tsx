import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { AnimatePresence, m } from 'motion/react'

import { useLanguage } from '../../i18n/LanguageContext'
import { useMotion } from '../../motion/MotionContext'
import { formatPrice, modelBadge, models, type TractorModel } from '../../data/models'
import { clearShortlist, toggleShortlist, usePersonal } from '../../personal/personal'
import { requestDemo } from '../../sections/DemoRequest/demoBus'
import { imageIn, openModelSheet } from '../../sections/ModelSheet/sheetBus'
import { ArrowRight, Check, Close } from '../Icons'
import { onCompare } from './compareBus'
import { goToSection } from '../../router'
import './shortlist.css'

/** The first number in a spec as published ("2.500 kg (3.000 kg optie)" → 2500, "94,5 cm" → 94.5). */
function leadingNumber(text: string): number | null {
  const m = /(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d+))?/.exec(text)
  if (!m) return null
  return Number(m[1]!.replace(/\./g, '') + (m[2] ? `.${m[2]}` : ''))
}

type Best = 'max' | 'min'

/** Indexes of the best value in a row — none when there is nothing to tell apart. */
function bestOf(values: (number | null)[], best: Best): Set<number> {
  const known = values.filter((v): v is number => v !== null)
  if (known.length < 2 || known.every((v) => v === known[0])) return new Set()
  const target = best === 'max' ? Math.max(...known) : Math.min(...known)
  return new Set(values.flatMap((v, i) => (v === target ? [i] : [])))
}

/**
 * The shortlist side by side: a picture and the name on top, then one row per
 * figure that matters when choosing — power, engine, lift, transmission, PTO,
 * width and price — with the best value in each row marked (by a check and a
 * label, not by colour alone). From here the reader opens any model's full
 * sheet (it opens on top, and closing it comes back here) or asks for a demo
 * of all of them in one go.
 */
export function CompareDialog() {
  const { t, l, lang } = useLanguage()
  const { lockScroll, calm } = useMotion()
  const { shortlist } = usePersonal()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)

  useEffect(
    () =>
      onCompare(() => {
        returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
        setOpen(true)
      }),
    [],
  )

  useEffect(() => {
    if (!open) return undefined
    lockScroll(true)
    const id = requestAnimationFrame(() => closeRef.current?.focus())
    return () => {
      cancelAnimationFrame(id)
      lockScroll(false)
    }
  }, [open, lockScroll])

  const close = useCallback(() => {
    setOpen(false)
    window.setTimeout(() => returnFocus.current?.focus(), calm ? 0 : 260)
  }, [calm])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      close()
      return
    }
    if (e.key !== 'Tab' || !panelRef.current) return
    const focusables = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
    ).filter((el) => el.offsetParent !== null)
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (!first || !last) return
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const list = shortlist.map((id) => models.find((x) => x.id === id)).filter((x): x is TractorModel => x !== undefined)
  const unit = lang === 'nl' ? 'pk' : 'hp'
  const S = t.shortlist

  const rows: { label: string; values: ReactNode[]; best?: Set<number>; bestLabel?: string }[] = [
    {
      label: t.models.power,
      values: list.map((x) => `${x.hp} ${unit}`),
      best: bestOf(
        list.map((x) => x.hp),
        'max',
      ),
      bestLabel: S.bestLabels.hp,
    },
    { label: t.models.specs.engine, values: list.map((x) => l(x.engine)) },
    {
      label: t.models.specs.lift,
      values: list.map((x) => l(x.lift)),
      best: bestOf(
        list.map((x) => leadingNumber(x.lift.nl)),
        'max',
      ),
      bestLabel: S.bestLabels.lift,
    },
    { label: t.models.specs.transmission, values: list.map((x) => l(x.transmission)) },
    { label: t.models.specs.pto, values: list.map((x) => l(x.pto)) },
    {
      label: t.models.specs.width,
      values: list.map((x) => (x.width ? l(x.width) : '—')),
      best: bestOf(
        list.map((x) => (x.width ? leadingNumber(x.width.nl) : null)),
        'min',
      ),
      bestLabel: S.bestLabels.width,
    },
    {
      label: t.models.from,
      values: list.map((x) => formatPrice(x.price, lang)),
      best: bestOf(
        list.map((x) => x.price),
        'min',
      ),
      bestLabel: S.bestLabels.price,
    },
  ]

  return (
    <AnimatePresence>
      {open && (
        <div key="compare" className="compare-dialog" onKeyDown={onKeyDown}>
          <m.button
            type="button"
            className="compare-dialog__backdrop"
            aria-label={S.close}
            tabIndex={-1}
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.24 } }}
          />
          <m.div
            ref={panelRef}
            className="compare-dialog__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="compare-dialog-title"
            initial={{ opacity: 0, y: 48, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, transition: { duration: 0.24, ease: [0.7, 0, 0.84, 0] } }}
          >
            <header className="compare-dialog__head">
              <h2 id="compare-dialog-title" className="display">
                {S.dialogTitle}
              </h2>
              <button type="button" className="sheet__close" ref={closeRef} aria-label={S.close} onClick={close}>
                <Close />
              </button>
            </header>

            <div className="compare-dialog__body" data-lenis-prevent="">
              {list.length === 0 ? (
                <p className="compare-dialog__empty">{S.empty}</p>
              ) : (
                <div className="compare-grid" style={{ '--cols': list.length } as CSSProperties}>
                  {list.map((x) => (
                    <div key={x.id} className="compare-grid__model">
                      <div className="compare-grid__pic">
                        <img src={x.image} alt="" width={1024} height={725} decoding="async" />
                      </div>
                      <span className="model-badge">{modelBadge(x, lang)}</span>
                      <h3 className="compare-grid__name">Solis {x.fullName}</h3>
                      <div className="compare-grid__actions">
                        <button
                          type="button"
                          className="text-link"
                          onClick={(e) =>
                            openModelSheet(x.id, 'overview', imageIn(e.currentTarget.closest('.compare-grid__model')))
                          }
                        >
                          {S.details}
                          <ArrowRight />
                        </button>
                        <button
                          type="button"
                          className="compare-grid__remove"
                          aria-label={S.remove(x.fullName)}
                          onClick={() => toggleShortlist(x.id)}
                        >
                          <Close />
                        </button>
                      </div>
                    </div>
                  ))}

                  {rows.map((row) => (
                    <div key={row.label} className="compare-grid__row">
                      <p className="compare-grid__label">{row.label}</p>
                      {row.values.map((value, i) => {
                        const best = row.best?.has(i) ?? false
                        return (
                          <p key={list[i]!.id} className="compare-grid__value" data-best={best ? 'true' : 'false'}>
                            <span className="visually-hidden">Solis {list[i]!.fullName}: </span>
                            {value}
                            {best && (
                              <span className="compare-grid__best">
                                <Check aria-hidden="true" />
                                {row.bestLabel}
                              </span>
                            )}
                          </p>
                        )
                      })}
                    </div>
                  ))}
                </div>
              )}
              {list.length === 1 && <p className="compare-dialog__more">{S.addMore}</p>}
            </div>

            <footer className="compare-dialog__foot">
              {list.length > 0 && (
                <button
                  type="button"
                  className="text-link compare-dialog__clear"
                  onClick={() => {
                    clearShortlist()
                    close()
                  }}
                >
                  {S.clear}
                </button>
              )}
              {list.length > 0 && (
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    requestDemo(list[0]!.id, S.message(list.map((x) => `Solis ${x.fullName}`).join(', ')))
                    close()
                    window.setTimeout(() => goToSection('demo'), calm ? 0 : 300)
                  }}
                >
                  {S.demo}
                  <ArrowRight className="btn__icon" />
                </button>
              )}
            </footer>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  )
}
