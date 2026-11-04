import { useState, type CSSProperties } from 'react'
import './compare-table.css'

import { useLanguage } from '../../i18n/LanguageContext'
import { formatPrice, modelBadge, models, segmentRange, segments, type Segment } from '../../data/models'
import { SlideChip } from '../../components/Chip'
import { useMatchIds } from '../../personal/personal'
import { ArrowRight, Check } from '../../components/Icons'
import { Reveal } from '../../components/Reveal'
import { imageIn, openModelSheet } from '../ModelSheet/sheetBus'
import { ShortlistToggle } from '../../components/Shortlist/ShortlistToggle'

/**
 * Section 03b — every model's key figures in one table, as published on
 * solistractor.nl/modellen. Filter by segment; "Details" opens the full
 * sheet on its specifications.
 */
export function CompareTable() {
  const { t, l, lang } = useLanguage()
  const c = t.compare.columns
  const [segment, setSegment] = useState<Segment | null>(null)
  const rows = segment ? models.filter((m) => m.segment === segment) : models
  const unit = lang === 'nl' ? 'pk' : 'hp'
  const matches = useMatchIds()

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
          <p className="compare__count" aria-live="polite">
            {t.compare.count(rows.length)}
          </p>
        </div>

        <Reveal className="compare__scroll">
          <table className="compare__table">
            <thead>
              <tr>
                <th scope="col">{c.model}</th>
                <th scope="col">{c.power}</th>
                <th scope="col">{c.engine}</th>
                <th scope="col">{c.lift}</th>
                <th scope="col">{c.transmission}</th>
                <th scope="col">{c.pto}</th>
                <th scope="col">{c.width}</th>
                <th scope="col">{c.price}</th>
                <th scope="col">
                  <span className="visually-hidden">{t.shortlist.title}</span>
                </th>
                <th scope="col">
                  <span className="visually-hidden">{t.compare.details}</span>
                </th>
              </tr>
            </thead>
            <tbody key={segment ?? 'all'}>
              {rows.map((m, i) => (
                <tr key={m.id} style={{ '--i': i } as CSSProperties}>
                  <th scope="row">
                    <span className="compare__model">
                      <img src={m.image} alt="" width={1024} height={725} loading="lazy" decoding="async" />
                      <span>
                        <strong>Solis {m.fullName}</strong>
                        <span className="model-badge">{modelBadge(m, lang)}</span>
                        {matches.includes(m.id) && (
                          <span className="match-badge">
                            <Check aria-hidden="true" />
                            {t.personal.match}
                          </span>
                        )}
                      </span>
                    </span>
                  </th>
                  <td className="compare__num">
                    {m.hp} <small>{unit}</small>
                  </td>
                  <td>{l(m.engine)}</td>
                  <td>{l(m.lift)}</td>
                  <td>{l(m.transmission)}</td>
                  <td>{l(m.pto)}</td>
                  <td className="compare__num">{m.width ? l(m.width) : '—'}</td>
                  <td className="compare__num compare__price">
                    {formatPrice(m.price, lang)}
                    <small>{t.models.vat}</small>
                  </td>
                  <td className="compare__save">
                    <ShortlistToggle modelId={m.id} />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="compare__details"
                      aria-label={`${t.compare.details}: Solis ${m.fullName}`}
                      onClick={(e) => openModelSheet(m.id, 'specs', imageIn(e.currentTarget.closest('tr')))}
                    >
                      {t.compare.details}
                      <ArrowRight />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
        <p className="compare__note">{t.compare.widthNote}</p>
      </div>
    </section>
  )
}
