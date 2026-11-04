import { useEffect, useState, type MouseEvent } from 'react'
import './site-header.css'

import { useLanguage, type Lang } from '../../i18n/LanguageContext'
import { useMotion } from '../../motion/MotionContext'
import { links } from '../../data/links'
import { EDITION, EDITIONS, editionPath, leaveForEdition } from '../../edition'
import { ArrowRight, Close, Menu, Phone, SolisLogo } from '../Icons'

const SECTIONS = [
  { id: 'modellen', key: 'models' },
  { id: 'keuzehulp', key: 'finder' },
  { id: 'techniek', key: 'tech' },
  { id: 'dealers', key: 'dealers' },
  { id: 'verhaal', key: 'about' },
] as const

/**
 * Fixed header. Transparent over the studio at the top of the page; once the
 * reader scrolls it frosts over and the utility strip folds away. It steps
 * aside while scrolling down — the film should have the whole screen — and
 * returns the moment the reader scrolls back up.
 */
export function SiteHeader() {
  const { t } = useLanguage()
  const { scrollTo, lockScroll } = useMotion()
  const [scrolled, setScrolled] = useState(false)
  const [overFilm, setOverFilm] = useState(true)
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let last = window.scrollY
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const y = window.scrollY
        setScrolled(y > 24)
        // Over the film edition's hero the bar stays clear and its type turns
        // white, so the film keeps the whole screen; past it, and throughout
        // the light studio edition, the frosted light bar is used.
        const hero = document.getElementById('top')
        setOverFilm(EDITION === 'film' && !!hero && y < hero.offsetTop + hero.offsetHeight - 80)
        if (Math.abs(y - last) > 6) {
          setHidden(y > last && y > 420)
          last = y
        }
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  useEffect(() => {
    lockScroll(open)
    if (!open) return undefined
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, lockScroll])

  const go = (id: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    setOpen(false)
    // After the menu has released the scroll lock.
    requestAnimationFrame(() => scrollTo(`#${id}`, { offset: id === 'top' ? 0 : -24 }))
  }

  return (
    <>
      <a className="skip-link" href="#inhoud">
        {t.nav.skip}
      </a>
      <header
        className="site-header"
        data-scrolled={scrolled ? 'true' : 'false'}
        data-tone={overFilm ? 'film' : 'paper'}
        data-hidden={hidden && !open ? 'true' : 'false'}
        data-open={open ? 'true' : 'false'}
      >
        {/* One quiet bar, as in the reference: wordmark, five links, one
            action. The warranty moved into the hero; service and phone live
            in the menu and the footer. */}
        <div className="site-header__bar">
          <div className="container site-header__bar-inner">
            <a className="site-header__brand" href="#top" onClick={go('top')} aria-label="Solis — home">
              <SolisLogo />
            </a>

            <nav className="site-header__nav" aria-label="Hoofdmenu">
              {SECTIONS.map((s) => (
                <a key={s.id} href={`#${s.id}`} onClick={go(s.id)}>
                  {t.nav[s.key]}
                </a>
              ))}
            </nav>

            <div className="site-header__end">
              <EditionSwitch />
              <LanguageSwitch />
              <a className="btn btn--navy btn--sm site-header__cta" href="#demo" onClick={go('demo')}>
                {t.nav.cta}
                <ArrowRight className="btn__icon" />
              </a>
              <button
                type="button"
                className="site-header__burger"
                aria-expanded={open}
                aria-controls="mobile-menu"
                aria-label={open ? t.nav.close : t.nav.menu}
                onClick={() => setOpen((v) => !v)}
              >
                {open ? <Close /> : <Menu />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mobile-menu" id="mobile-menu" data-open={open ? 'true' : 'false'} aria-hidden={!open}>
        <nav className="mobile-menu__nav">
          {SECTIONS.map((s, i) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={go(s.id)}
              tabIndex={open ? 0 : -1}
              style={{ transitionDelay: open ? `${80 + i * 50}ms` : '0ms' }}
            >
              <span>{String(i + 1).padStart(2, '0')}</span>
              {t.nav[s.key]}
            </a>
          ))}
        </nav>
        <div className="mobile-menu__foot">
          <a className="btn" href="#demo" onClick={go('demo')} tabIndex={open ? 0 : -1}>
            {t.nav.cta}
            <ArrowRight className="btn__icon" />
          </a>
          <a className="mobile-menu__phone" href={links.phone} tabIndex={open ? 0 : -1}>
            <Phone />
            {t.utility.phone}
          </a>
          <EditionSwitch light />
          <LanguageSwitch light />
        </div>
      </div>
    </>
  )
}

/**
 * Film | Studio: the two editions of the page (edition.ts). A link, not a
 * toggle — each edition loads its own film, so switching is a fresh page.
 */
function EditionSwitch({ light = false }: { light?: boolean }) {
  const { t } = useLanguage()
  return (
    <nav className="edition-switch" data-light={light ? 'true' : 'false'} aria-label={t.footer.edition}>
      {EDITIONS.map((e) => (
        <a
          key={e}
          href={editionPath[e]}
          aria-current={e === EDITION ? 'page' : undefined}
          onClick={(ev) => e !== EDITION && leaveForEdition(ev, editionPath[e])}
        >
          {t.footer.editions[e]}
        </a>
      ))}
    </nav>
  )
}

function LanguageSwitch({ light = false }: { light?: boolean }) {
  const { lang, setLang, t } = useLanguage()
  const options: Lang[] = ['nl', 'en']
  return (
    <div className="lang-switch" data-light={light ? 'true' : 'false'} role="group" aria-label={t.nav.language}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={lang === option}
          onClick={() => setLang(option)}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

/** Ascenta-style "Pause motion": stops smooth scrolling and every ambient loop on the page. */
export function MotionToggle() {
  const { t } = useLanguage()
  const { paused, setPaused, systemReduced } = useMotion()
  // Offered over the hero only, where the motion is; further down the
  // corner belongs to the content. The choice itself applies page-wide.
  const [overHero, setOverHero] = useState(true)

  useEffect(() => {
    const onScroll = () => {
      const hero = document.getElementById('top')
      const end = hero ? hero.offsetTop + hero.offsetHeight - window.innerHeight * 0.6 : 0
      setOverHero(window.scrollY < end)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (systemReduced) return null
  return (
    <button
      type="button"
      className="motion-toggle"
      data-show={overHero ? 'true' : 'false'}
      aria-pressed={paused}
      onClick={() => setPaused(!paused)}
    >
      <span className="motion-toggle__icon" data-paused={paused ? 'true' : 'false'} aria-hidden="true" />
      <span className="motion-toggle__label">{paused ? t.motion.resume : t.motion.pause}</span>
    </button>
  )
}
