import './hero-static.css'

import { useLanguage } from '../../i18n/LanguageContext'
import { useMotion } from '../../motion/MotionContext'
import { chapterKicker } from '../../data/timeline'
import { ArrowRight } from '../../components/Icons'

interface HeroStaticProps {
  /** the frames could not load (as opposed to reduced motion being asked for) */
  failed: boolean
  /** dark for the film edition, light for the studio edition */
  tone: 'dark' | 'light'
  /** the finished tractor, from the edition's own film */
  image: string
  /** the chapters, in the edition's order */
  chapterIds: string[]
}

/**
 * Either hero without its film: for readers who asked their system for
 * reduced motion, and the fallback if the frames cannot load. Same words, the
 * finished tractor as a still, and the five chapters as a plain sequence.
 */
export function HeroStatic({ failed, tone, image, chapterIds }: HeroStaticProps) {
  const { t } = useLanguage()
  const { scrollTo } = useMotion()
  const chapters = chapterIds.map((id) => t.hero.chapters.find((c) => c.id === id)).filter((c) => c !== undefined)

  return (
    <section className="hero-static" data-tone={tone} id="top" aria-labelledby="hero-static-title">
      <div className="container hero-static__inner">
        <div className="hero-static__copy">
          <p className={tone === 'dark' ? 'eyebrow eyebrow--light' : 'eyebrow'}>{t.hero.eyebrow}</p>
          <h1 id="hero-static-title" className="display display--xl">
            {t.hero.title.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>
          <p className="lead">{t.hero.lead}</p>
          <div className="hero-static__actions">
            <a
              className="btn"
              href="#modellen"
              onClick={(e) => {
                e.preventDefault()
                scrollTo('#modellen', { offset: -24 })
              }}
            >
              {t.hero.primary}
              <ArrowRight className="btn__icon" />
            </a>
            <a
              className={tone === 'dark' ? 'btn btn--ghost-light' : 'btn btn--ghost'}
              href="#keuzehulp"
              onClick={(e) => {
                e.preventDefault()
                scrollTo('#keuzehulp', { offset: -24 })
              }}
            >
              {t.hero.secondary}
            </a>
          </div>
          {failed && <p className="hero-static__note">{t.hero.fallback}</p>}
        </div>
        <img className="hero-static__image" src={image} alt="" />
      </div>

      <ol className="container hero-static__chapters">
        {chapters.map((c, i) => (
          <li key={c.id}>
            <p className="hero-static__kicker">{chapterKicker(i, c.label)}</p>
            <h2 className="display display--md">{c.title.join(' ')}</h2>
            <p>{c.body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
