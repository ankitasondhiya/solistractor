import { useState } from 'react'
import './dealers.css'

import { useLanguage } from '../../i18n/LanguageContext'
import { dealers, provinces, type Province } from '../../data/dealers'
import { links } from '../../data/links'
import { ArrowUpRight, Check, Pin } from '../../components/Icons'
import { Reveal } from '../../components/Reveal'

/** Section 07 — the twenty dealers, filtered by province on the page. */
export function Dealers() {
  const { t } = useLanguage()
  const [province, setProvince] = useState<Province | null>(null)
  const shown = province ? dealers.filter((d) => d.province === province) : dealers

  return (
    <section className="section dealers" id="dealers" aria-labelledby="dealers-title">
      <div className="container dealers__grid">
        <Reveal className="dealers__intro">
          <p className="eyebrow">{t.dealers.eyebrow}</p>
          <h2 id="dealers-title" className="display display--lg">
            {t.dealers.title.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h2>
          <p className="lead">{t.dealers.lead}</p>

          <p className="dealers__count">
            {dealers.length}
            <span>{t.dealers.count}</span>
          </p>

          <ul className="dealers__services">
            {t.dealers.services.map((service) => (
              <li key={service}>
                <Check />
                {service}
              </li>
            ))}
          </ul>

          <p className="dealers__become">
            {t.dealers.become}{' '}
            <a className="text-link" href={links.becomeDealer}>
              {t.dealers.becomeCta}
            </a>
          </p>
        </Reveal>

        <div className="dealers__finder">
          <div className="dealers__filter" role="group" aria-label={t.dealers.filter}>
            <p className="dealers__filter-label">{t.dealers.filter}</p>
            <div className="dealers__chips">
              <button type="button" className="chip" aria-pressed={province === null} onClick={() => setProvince(null)}>
                {t.dealers.all}
              </button>
              {provinces.map((p) => (
                <button key={p} type="button" className="chip" aria-pressed={province === p} onClick={() => setProvince(p)}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <p className="dealers__results" aria-live="polite">
            {t.dealers.results(shown.length)}
          </p>

          <ul className="dealers__list" key={province ?? 'all'}>
            {shown.map((d, i) => (
              <li key={d.href} style={{ animationDelay: `${Math.min(i, 10) * 35}ms` }}>
                <a className="dealer-card" href={d.href} data-importer={d.importer ? 'true' : 'false'}>
                  <span className="dealer-card__top">
                    <span className="dealer-card__province">{d.province}</span>
                    {d.importer && <span className="dealer-card__badge">{t.dealers.importer}</span>}
                  </span>
                  <strong className="dealer-card__name">{d.name}</strong>
                  <span className="dealer-card__town">
                    <Pin />
                    {d.town}
                  </span>
                  <span className="dealer-card__cta">
                    {t.dealers.view}
                    <ArrowUpRight />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
