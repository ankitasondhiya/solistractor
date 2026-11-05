import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { AnimatePresence, m, type MotionStyle } from 'motion/react'
import './compare-table.css'

import { useLanguage } from '../../i18n/LanguageContext'
import {
  formatPrice,
  modelBadge,
  models,
  segmentRange,
  segments,
  type Segment,
  type TractorModel,
} from '../../data/models'
import { SlideChip } from '../../components/Chip'
import { Reveal } from '../../components/Reveal'
import { RollingNumber } from '../../components/RollingNumber'
import { useMatchIds } from '../../personal/personal'
import { ArrowDown, ArrowRight, Check } from '../../components/Icons'
import { imageIn, openModelSheet } from '../ModelSheet/sheetBus'
import { ShortlistToggle } from '../../components/Shortlist/ShortlistToggle'

/* Figures -------------------------------------------------------------------- */

/** The numbers in a published value: "2.500 kg (3.000 kg optie)" → [2500, 3000], "94,5 cm" → [94.5]. */
const numbers = (text: string) =>
  (text.match(/\d[\d.,]*/g) ?? []).map((n) => Number(n.replace(/\./g, '').replace(',', '.')))

interface Figures {
  /** standard lift capacity, kg */
  lift: number
  /** with the optional upgrade, where there is one */
  liftOption: number | null
  /** cm, where published */
  width: number | null
}

const FIGURES = new Map<string, Figures>(
  models.map((x) => {
    const [lift = 0, liftOption = null] = numbers(x.lift.nl)
    return [x.id, { lift, liftOption, width: x.width ? (numbers(x.width.nl)[0] ?? null) : null }]
  }),
)
const figures = (x: TractorModel) => FIGURES.get(x.id)!

/** The meters run to the strongest figure in the range. */
const POWER_MAX = Math.max(...models.map((x) => x.hp))
const LIFT_MAX = Math.max(...models.map((x) => figures(x).liftOption ?? figures(x).lift))

/* Sorting -------------------------------------------------------------------- */

type SortKey = 'power' | 'lift' | 'width' | 'price'
type SortDir = 'ascending' | 'descending'
interface Sort {
  key: SortKey
  dir: SortDir
}

/** The first press asks the obvious question: most power and lift, narrowest and cheapest first. */
const FIRST: Record<SortKey, SortDir> = { power: 'descending', lift: 'descending', width: 'ascending', price: 'ascending' }

const sortValue = (x: TractorModel, key: SortKey): number | null =>
  key === 'power' ? x.hp : key === 'lift' ? figures(x).lift : key === 'width' ? figures(x).width : x.price

/**
 * A stable sort on one figure: equal figures keep the published order (by
 * power, then price), and models without a published figure go last.
 */
function sortModels(list: TractorModel[], sort: Sort | null): TractorModel[] {
  if (!sort) return list
  const sign = sort.dir === 'ascending' ? 1 : -1
  return [...list].sort((a, b) => {
    const va = sortValue(a, sort.key)
    const vb = sortValue(b, sort.key)
    if (va === null || vb === null) return va === vb ? 0 : va === null ? 1 : -1
    return (va - vb) * sign
  })
}

/** Press: the first direction, then the other, then back to the published order. */
function nextSort(current: Sort | null, key: SortKey): Sort | null {
  if (!current || current.key !== key) return { key, dir: FIRST[key] }
  if (current.dir === FIRST[key]) return { key, dir: FIRST[key] === 'ascending' ? 'descending' : 'ascending' }
  return null
}

/** How long the first cascade takes, so later rows can arrive without it. */
const CASCADE_MS = 2000

/**
 * Section 03b — every model's key figures in one table, as published on
 * solistractor.nl/modellen.
 *
 * Motion, each with a job: the rows fill in as a diagonal wave when the
 * table first scrolls into view, the power and lift meters grow to scale,
 * and filtering or sorting (power, lift, width, price) lets every row glide
 * to its new place instead of jumping (Motion layout). Hover marks the row
 * and the column under the pointer, so a figure can be followed across the
 * range. "Details" opens the full sheet on its specifications.
 */
export function CompareTable() {
  const { t, l, lang } = useLanguage()
  const c = t.compare.columns
  const [segment, setSegment] = useState<Segment | null>(null)
  const [sort, setSort] = useState<Sort | null>(null)
  const rows = useMemo(
    () => sortModels(segment ? models.filter((x) => x.segment === segment) : models, sort),
    [segment, sort],
  )
  const unit = lang === 'nl' ? 'pk' : 'hp'
  const matches = useMatchIds()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Reveal: shown once the table is in view; settled once its cascade is over,
  // after which rows that arrive (a filter) come in on their own, quickly.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return undefined
    let timer = 0
    const show = () => {
      el.dataset.shown = 'true'
      timer = window.setTimeout(() => {
        el.dataset.settled = 'true'
      }, CASCADE_MS)
    }
    if (!('IntersectionObserver' in window)) {
      show()
      return undefined
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect()
          show()
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      window.clearTimeout(timer)
    }
  }, [])

  // The column under the pointer (figures 2–8), set on the table directly: no re-render per cell.
  const onPointerOver = (e: PointerEvent<HTMLTableElement>) => {
    if (e.pointerType !== 'mouse') return
    const cell = (e.target as Element).closest('td, th') as HTMLTableCellElement | null
    const column = cell ? cell.cellIndex + 1 : 0
    e.currentTarget.dataset.col = column >= 2 && column <= 8 ? String(column) : ''
  }

  const sortHeader = (key: SortKey, label: string) => (
    <th scope="col" aria-sort={sort?.key === key ? sort.dir : undefined}>
      <button type="button" className="compare__sort" onClick={() => setSort((s) => nextSort(s, key))}>
        {label}
        <ArrowDown className="compare__sort-icon" aria-hidden="true" />
      </button>
    </th>
  )

  return (
    <section className="section compare" id="vergelijken" aria-labelledby="compare-title">
      <div className="container">
        <Reveal className="section-head section-head--split">
          <div>
            <p className="eyebrow">{t.compare.eyebrow}</p>
            <h2 id="compare-title" className="display display--lg">
              {t.compare.title.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h2>
          </div>
          <p className="lead">{t.compare.lead}</p>
        </Reveal>

        <div className="compare__bar">
          <div className="compare__chips" role="group" aria-label={t.models.all}>
            <SlideChip group="compare" pressed={segment === null} onClick={() => setSegment(null)}>
              {t.models.all}
            </SlideChip>
            {segments.map((s) => (
              <SlideChip key={s} group="compare" pressed={segment === s} onClick={() => setSegment(s)}>
                {t.models.segments[s]}
                <span className="chip__note">{segmentRange(s, lang)}</span>
              </SlideChip>
            ))}
          </div>
          <div className="compare__meta">
            <p className="compare__count" aria-live="polite">
              <RollingNumber value={rows.length} format={(n) => t.compare.count(Math.round(n))} duration={500} />
            </p>
            <p className="compare__hint">{t.compare.sortHint}</p>
          </div>
        </div>

        <div
          className="compare__scroll"
          ref={scrollRef}
          data-reveal=""
          onScroll={(e) => {
            e.currentTarget.dataset.scrolled = e.currentTarget.scrollLeft > 2 ? 'true' : 'false'
          }}
        >
          <table
            className="compare__table"
            onPointerOver={onPointerOver}
            onPointerLeave={(e) => {
              e.currentTarget.dataset.col = ''
            }}
          >
            <thead>
              <tr>
                <th scope="col">{c.model}</th>
                {sortHeader('power', c.power)}
                <th scope="col">{c.engine}</th>
                {sortHeader('lift', c.lift)}
                <th scope="col">{c.transmission}</th>
                <th scope="col">{c.pto}</th>
                {sortHeader('width', c.width)}
                {sortHeader('price', c.price)}
                <th scope="col">
                  <span className="visually-hidden">{t.shortlist.title}</span>
                </th>
                <th scope="col">
                  <span className="visually-hidden">{t.compare.details}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {rows.map((x, i) => {
                  const f = figures(x)
                  return (
                    <m.tr
                      key={x.id}
                      layout="position"
                      style={{ '--i': i } as unknown as MotionStyle}
                      // Rows a filter brings in fade up; rows already here keep their place in the
                      // first render (AnimatePresence initial={false}), where CSS runs the wave.
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        layout: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                        opacity: { duration: 0.32, delay: 0.12, ease: [0.16, 1, 0.3, 1] },
                      }}
                      exit={{ opacity: 0, transition: { duration: 0.16, ease: [0.7, 0, 0.84, 0] } }}
                    >
                      <th scope="row">
                        <span className="compare__model">
                          <img src={x.image} alt="" width={1024} height={725} loading="lazy" decoding="async" />
                          <span>
                            <strong>Solis {x.fullName}</strong>
                            <span className="model-badge">{modelBadge(x, lang)}</span>
                            {matches.includes(x.id) && (
                              <span className="match-badge">
                                <Check aria-hidden="true" />
                                {t.personal.match}
                              </span>
                            )}
                          </span>
                        </span>
                      </th>
                      <td className="compare__num">
                        {x.hp} <small>{unit}</small>
                        <Meter value={x.hp / POWER_MAX} />
                      </td>
                      <td>{l(x.engine)}</td>
                      <td>
                        {l(x.lift)}
                        <Meter
                          value={f.lift / LIFT_MAX}
                          option={f.liftOption ? f.liftOption / LIFT_MAX : undefined}
                        />
                      </td>
                      <td>{l(x.transmission)}</td>
                      <td>{l(x.pto)}</td>
                      <td className="compare__num">{x.width ? l(x.width) : '—'}</td>
                      <td className="compare__num compare__price">
                        {formatPrice(x.price, lang)}
                        <small>{t.models.vat}</small>
                      </td>
                      <td className="compare__save">
                        <ShortlistToggle modelId={x.id} />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="compare__details"
                          aria-label={`${t.compare.details}: Solis ${x.fullName}`}
                          onClick={(e) => openModelSheet(x.id, 'specs', imageIn(e.currentTarget.closest('tr')))}
                        >
                          {t.compare.details}
                          <ArrowRight />
                        </button>
                      </td>
                    </m.tr>
                  )
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        <p className="compare__note">{t.compare.widthNote}</p>
      </div>
    </section>
  )
}

/**
 * A figure's share of the range's strongest, as a short bar under it; the
 * optional upgrade, where there is one, as a lighter extension. Decorative:
 * the figure itself is the text.
 */
function Meter({ value, option }: { value: number; option?: number }) {
  return (
    <span className="compare__meter" aria-hidden="true">
      {option !== undefined && (
        <span className="compare__meter-fill compare__meter-fill--option" style={{ '--v': option } as CSSProperties} />
      )}
      <span className="compare__meter-fill" style={{ '--v': value } as CSSProperties} />
    </span>
  )
}
