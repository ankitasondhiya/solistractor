import { useEffect, useState, type ComponentType, type SVGProps } from 'react'
import './model-finder.css'

import { useLanguage } from '../../i18n/LanguageContext'
import { useMotion } from '../../motion/MotionContext'
import { formatPrice, modelBadge, recommend, type Space, type Use } from '../../data/models'
import { Apple, ArrowRight, Horseshoe, Loader, Tree, Wheat, Yard } from '../../components/Icons'
import { Reveal } from '../../components/Reveal'
import { requestDemo } from '../DemoRequest/demoBus'
import { openModelSheet } from '../ModelSheet/sheetBus'
import { getPersonal, setFinderAnswers } from '../../personal/personal'

const USES: { id: Use; Icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { id: 'yard', Icon: Yard },
  { id: 'grounds', Icon: Tree },
  { id: 'equestrian', Icon: Horseshoe },
  { id: 'orchard', Icon: Apple },
  { id: 'farming', Icon: Wheat },
  { id: 'loader', Icon: Loader },
]

const SPACES: Space[] = ['tight', 'medium', 'open']

/**
 * Section 04 — "Welke past bij mijn werk?", answered on the page instead of
 * behind a link. Two questions; the recommendation updates as they are
 * answered. The scoring is in data/models.ts.
 */
export function ModelFinder() {
  const { t, l, lang } = useLanguage()
  const { scrollTo } = useMotion()
  // A returning reader finds their own answers — and so their shortlist — still in place.
  const [use, setUse] = useState<Use | null>(() => getPersonal().finder?.use ?? null)
  const [space, setSpace] = useState<Space | null>(() => getPersonal().finder?.space ?? null)

  useEffect(() => {
    if (use) setFinderAnswers({ use, space })
  }, [use, space])

  const results = use ? recommend(use, space) : []

  return (
    <section className="section finder" id="keuzehulp" aria-labelledby="finder-title">
      <div className="container finder__grid">
        <div className="finder__questions">
          <Reveal className="finder__head">
            <p className="eyebrow eyebrow--light">{t.finder.eyebrow}</p>
            <h2 id="finder-title" className="display display--lg">
              {t.finder.title.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h2>
            <p className="lead">{t.finder.lead}</p>
          </Reveal>

          <fieldset className="finder__step">
            <legend>
              <span>01</span>
              {t.finder.step1}
            </legend>
            <div className="finder__uses">
              {USES.map(({ id, Icon }) => (
                <button
                  key={id}
                  type="button"
                  className="finder__use"
                  aria-pressed={use === id}
                  onClick={() => setUse(id)}
                >
                  <Icon />
                  {t.finder.uses[id]}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="finder__step" disabled={!use}>
            <legend>
              <span>02</span>
              {t.finder.step2}
            </legend>
            <div className="finder__spaces">
              {SPACES.map((id) => (
                <button
                  key={id}
                  type="button"
                  className="finder__space"
                  aria-pressed={space === id}
                  onClick={() => setSpace((current) => (current === id ? null : id))}
                >
                  <strong>{t.finder.spaces[id].label}</strong>
                  <small>{t.finder.spaces[id].hint}</small>
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="finder__panel" aria-live="polite">
          <p className="finder__panel-title">{t.finder.resultTitle}</p>
          {results.length === 0 ? (
            <p className="finder__empty">{t.finder.empty}</p>
          ) : (
            <ol className="finder__results">
              {results.map(({ model, score }, i) => (
                <li key={`${use}-${space}-${model.id}`} className="finder__result" style={{ animationDelay: `${i * 80}ms` }}>
                  <img src={model.image} alt="" width={1024} height={725} loading="lazy" decoding="async" />
                  <div className="finder__result-body">
                    <p className="finder__result-top">
                      {i === 0 && <span className="finder__best">{t.finder.best}</span>}
                      <span className="model-badge">{modelBadge(model, lang)}</span>
                    </p>
                    <h3 className="display">Solis {model.fullName}</h3>
                    <p className="finder__pitch">{l(model.pitch)}</p>
                    <div className="finder__meter">
                      <span className="finder__meter-bar">
                        <span style={{ width: `${Math.round(score * 100)}%` }} />
                      </span>
                      <span>
                        {Math.round(score * 100)}% {t.finder.match}
                      </span>
                    </div>
                    <div className="finder__result-foot">
                      <span className="finder__price">
                        {formatPrice(model.price, lang)} <small>{t.models.vat}</small>
                      </span>
                      <button type="button" className="finder__link" onClick={() => openModelSheet(model.id)}>
                        {t.sheet.open}
                        <ArrowRight />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
          <p className="finder__disclaimer">{t.finder.disclaimer}</p>
          <button
            type="button"
            className="btn"
            onClick={() => {
              requestDemo(results[0]?.model.id ?? null)
              scrollTo('#demo', { offset: -24 })
            }}
          >
            {t.finder.demo}
            <ArrowRight className="btn__icon" />
          </button>
        </div>
      </div>
    </section>
  )
}
