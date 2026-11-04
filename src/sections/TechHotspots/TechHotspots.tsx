import { useState, type CSSProperties } from 'react'
import './tech-hotspots.css'

import { useLanguage } from '../../i18n/LanguageContext'
import { links } from '../../data/links'
import { EDITION, type Edition } from '../../edition'
import { ArrowRight, Plus } from '../../components/Icons'
import { Reveal } from '../../components/Reveal'

type Spots = Record<string, { x: number; y: number }>

/**
 * The finished tractor from each edition's film, and where each detail sits
 * on it as fractions of the picture (measured on the image itself).
 */
const FIGURE: Record<Edition, { src: string; width: number; height: number; spots: Spots }> = {
  // The red S75 in the dark studio, frame 53 of the film.
  film: {
    src: '/media/film/tractor-studio.webp',
    width: 1920,
    height: 1080,
    spots: {
      engine: { x: 0.36, y: 0.45 },
      seat: { x: 0.54, y: 0.31 },
      rops: { x: 0.69, y: 0.2 },
      drive: { x: 0.715, y: 0.64 },
      axle: { x: 0.18, y: 0.65 },
      lights: { x: 0.235, y: 0.45 },
    },
  },
  // The blue tractor's last frame, cut out on the cream studio.
  studio: {
    src: '/media/studio/tractor-complete.webp',
    width: 1280,
    height: 720,
    spots: {
      engine: { x: 0.41, y: 0.36 },
      seat: { x: 0.586, y: 0.26 },
      rops: { x: 0.68, y: 0.17 },
      drive: { x: 0.715, y: 0.56 },
      axle: { x: 0.19, y: 0.6 },
      lights: { x: 0.26, y: 0.4 },
    },
  },
}

const { src: FIGURE_SRC, width: FIGURE_W, height: FIGURE_H, spots: SPOTS } = FIGURE[EDITION]

/** Section 05 — the assembled machine, with its details to open one by one. */
export function TechHotspots() {
  const { t } = useLanguage()
  const [active, setActive] = useState(t.tech.spots[0]?.id ?? 'engine')
  const current = t.tech.spots.find((s) => s.id === active)
  const currentSpot = SPOTS[active]

  return (
    <section className="section tech" id="techniek" aria-labelledby="tech-title">
      <div className="container">
        <Reveal className="section-head section-head--split">
          <div>
            <p className="eyebrow">{t.tech.eyebrow}</p>
            <h2 id="tech-title" className="display display--lg">
              {t.tech.title.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h2>
          </div>
          <div className="section-head__lead">
            <p className="lead">{t.tech.lead}</p>
            <a className="text-link" href={links.models}>
              {t.tech.cta}
              <ArrowRight />
            </a>
          </div>
        </Reveal>

        <div className="tech__grid">
          <Reveal className={`tech__figure tech__figure--${EDITION}`}>
            <img src={FIGURE_SRC} alt="" width={FIGURE_W} height={FIGURE_H} loading="lazy" />
            {t.tech.spots.map((spot, i) => {
              const pos = SPOTS[spot.id]
              if (!pos) return null
              return (
                <button
                  key={spot.id}
                  type="button"
                  className="tech__spot"
                  style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%` } as CSSProperties}
                  aria-pressed={active === spot.id}
                  aria-label={spot.title}
                  onClick={() => setActive(spot.id)}
                >
                  <span className="tech__spot-num">{i + 1}</span>
                  <Plus className="tech__spot-plus" />
                </button>
              )
            })}
            {current && currentSpot && (
              <div
                key={current.id}
                className="tech__pop"
                data-side={currentSpot.x > 0.5 ? 'left' : 'right'}
                style={{ left: `${currentSpot.x * 100}%`, top: `${currentSpot.y * 100}%` } as CSSProperties}
                aria-hidden="true"
              >
                <strong>{current.title}</strong>
                <span>{current.body}</span>
              </div>
            )}
            <p className="tech__hint">{t.tech.hint}</p>
          </Reveal>

          <ol className="tech__list">
            {t.tech.spots.map((spot, i) => (
              <li key={spot.id}>
                <button type="button" aria-pressed={active === spot.id} onClick={() => setActive(spot.id)}>
                  <span className="tech__list-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="tech__list-copy">
                    <strong>{spot.title}</strong>
                    <span>{spot.body}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
