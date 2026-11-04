import { useEffect, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import './action-bar.css'

import { useLanguage } from '../../i18n/LanguageContext'
import { links } from '../../data/links'
import { byDistance } from '../../data/dealers'
import { usePersonal } from '../../personal/personal'
import { openCompare } from '../Shortlist/compareBus'
import { goToSection } from '../../router'
import { ArrowRight, Heart, Phone, Pin } from '../Icons'

/**
 * Phones: the page's three actions within thumb reach — call, find the dealer,
 * plan a demo — plus the shortlist once something is saved (ui-ux-pro-max:
 * thumb-zone primary actions, fixed-element-offset). It stays out of the way
 * where it would repeat the page: over the opening film, and once the demo
 * form or the footer is on screen. The dealer button names the reader's own
 * nearest dealer when the page knows where they are.
 */
export function ActionBar() {
  const { t } = useLanguage()
  const { shortlist, place } = usePersonal()
  const [pastHero, setPastHero] = useState(false)
  const [atEnd, setAtEnd] = useState(false)

  useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > window.innerHeight * 0.8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Hidden while the demo form or the footer is in view — they carry the same actions.
  useEffect(() => {
    const targets = ['#demo', '.site-footer'].map((s) => document.querySelector(s)).filter((el) => el !== null)
    const inView = new Set<Element>()
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => (e.isIntersecting ? inView.add(e.target) : inView.delete(e.target)))
        setAtEnd(inView.size > 0)
      },
      { rootMargin: '0px 0px -30% 0px' },
    )
    targets.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const visible = pastHero && !atEnd

  // Lets the motion toggle and the studio companion step up above the bar.
  useEffect(() => {
    document.documentElement.dataset.actionbar = visible ? 'true' : 'false'
  }, [visible])

  const near = place ? byDistance(place)[0] : undefined
  const A = t.actionBar

  return (
    <AnimatePresence>
      {visible && (
        <m.nav
          key="actionbar"
          className="action-bar"
          aria-label={A.label}
          initial={{ y: '110%' }}
          animate={{ y: 0 }}
          exit={{ y: '110%', transition: { duration: 0.24, ease: [0.7, 0, 0.84, 0] } }}
        >
          <a className="action-bar__item" href={links.phone}>
            <Phone aria-hidden="true" />
            <span>{A.call}</span>
          </a>
          <button
            type="button"
            className="action-bar__item"
            onClick={() => goToSection('dealers')}
          >
            <Pin aria-hidden="true" />
            <span>
              {A.dealer}
              {near && <small> · {t.dealers.locate.km(near.km)}</small>}
            </span>
          </button>
          {shortlist.length > 0 && (
            <button type="button" className="action-bar__item action-bar__item--saved" onClick={openCompare}>
              <span className="action-bar__heart">
                <Heart aria-hidden="true" />
                <span className="action-bar__count">{shortlist.length}</span>
              </span>
              <span>{A.shortlist}</span>
            </button>
          )}
          <button
            type="button"
            className="action-bar__item action-bar__item--primary"
            onClick={() => goToSection('demo')}
          >
            <span>{A.demo}</span>
            <ArrowRight aria-hidden="true" />
          </button>
        </m.nav>
      )}
    </AnimatePresence>
  )
}
