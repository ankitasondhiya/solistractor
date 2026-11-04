import { useEffect, useRef, type ComponentType, type CSSProperties, type SVGProps } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './pillars.css'

import { useLanguage } from '../../i18n/LanguageContext'
import { useMotion } from '../../motion/MotionContext'
import { dealers } from '../../data/dealers'
import { media } from '../../data/links'
import { EDITION, type Edition } from '../../edition'
import { Partnership, Seat, Wheel, Wrench } from '../../components/Icons'
import { Reveal } from '../../components/Reveal'

gsap.registerPlugin(ScrollTrigger)

type Visual =
  | { kind: 'icon'; Icon: ComponentType<SVGProps<SVGSVGElement>> }
  | { kind: 'image'; src: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }
  | { kind: 'count'; Icon: ComponentType<SVGProps<SVGSVGElement>> }

/**
 * One visual per pillar, in the order of `why.pillars`, with the card's tone.
 * Each edition shows its own film: the red S75's tyre and cab, or the blue
 * tractor's wheels cut out on the studio cream.
 */
const VISUALS: Record<Edition, Visual[]> = {
  film: [
    { kind: 'icon', Icon: Partnership },
    { kind: 'image', src: '/media/film/tractor-tyre.webp', Icon: Wheel },
    { kind: 'image', src: '/media/film/tractor-studio.webp', Icon: Seat },
    { kind: 'count', Icon: Wrench },
  ],
  studio: [
    { kind: 'icon', Icon: Partnership },
    { kind: 'image', src: '/media/studio/tractor-chassis-wheels.webp', Icon: Wheel },
    { kind: 'image', src: media.detail, Icon: Seat },
    { kind: 'count', Icon: Wrench },
  ],
}

const TONES: Record<Edition, readonly string[]> = {
  film: ['navy', 'film', 'cream', 'green'],
  studio: ['navy', 'studio', 'cream', 'green'],
}

/**
 * The four reasons, as a deck: each card pins below the header and the next
 * slides up over it while the one beneath settles back (after Enki's Web
 * Studio's service cards).
 */
export function Pillars() {
  const { t } = useLanguage()
  const { systemReduced } = useMotion()
  const listRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const list = listRef.current
    if (!list || systemReduced) return undefined
    const cards = Array.from(list.querySelectorAll<HTMLElement>('.pillar'))
    const ctx = gsap.context(() => {
      cards.forEach((card, i) => {
        const next = cards[i + 1]
        if (!next) return
        gsap.to(card.querySelector('.pillar__card'), {
          scale: 0.92,
          // An overlay's opacity, not a filter: filters repaint the whole card
          // on every scroll frame, opacity stays on the compositor.
          '--dim': 0.22,
          ease: 'none',
          scrollTrigger: {
            trigger: next,
            start: 'top bottom',
            end: 'top 20%',
            scrub: true,
          },
        })
      })
    }, list)
    return () => ctx.revert()
  }, [systemReduced])

  return (
    <section className="section pillars" aria-labelledby="pillars-title">
      <div className="container">
        <Reveal className="section-head section-head--split">
          <div>
            <p className="eyebrow">{t.why.eyebrow}</p>
            <h2 id="pillars-title" className="display display--lg">
              {t.why.title.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h2>
          </div>
          <p className="lead">{t.why.lead}</p>
        </Reveal>

        <ol className="pillars__list" ref={listRef} data-static={systemReduced ? 'true' : 'false'}>
          {t.why.pillars.map((pillar, i) => {
            const visual = VISUALS[EDITION][i]
            const tone = TONES[EDITION][i] ?? 'cream'
            return (
              <li key={pillar.title} className="pillar" style={{ '--i': i } as CSSProperties}>
                <article className="pillar__card" data-tone={tone}>
                  <div className="pillar__copy">
                    <p className="pillar__num">
                      {String(i + 1).padStart(2, '0')} <span>/ 04</span>
                    </p>
                    <h3 className="display pillar__title">{pillar.title}</h3>
                    <p className="pillar__label">{pillar.label}</p>
                    <p className="pillar__body">{pillar.body}</p>
                  </div>
                  <div className="pillar__visual" aria-hidden="true">
                    {visual?.kind === 'image' && <img src={visual.src} alt="" loading="lazy" />}
                    {visual?.kind === 'icon' && <visual.Icon className="pillar__glyph" />}
                    {visual?.kind === 'count' && (
                      <span className="pillar__count">
                        {dealers.length}
                        <small>{t.dealers.count}</small>
                      </span>
                    )}
                    {visual && (
                      <span className="pillar__badge">
                        <visual.Icon />
                      </span>
                    )}
                  </div>
                </article>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
