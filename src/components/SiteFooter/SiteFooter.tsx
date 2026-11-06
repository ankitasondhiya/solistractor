import { useState } from 'react'
import './site-footer.css'

import { useLanguage } from '../../i18n/LanguageContext'
import { links } from '../../data/links'
import { EDITION, EDITIONS, editionPath, leaveForEdition } from '../../edition'
import { Mail, Phone, Pin, SolisLogo } from '../Icons'
import { forgetEverything } from '../../personal/personal'

/** Footer menu targets, in the order of `footer.links`. */
const MENU = [
  links.home,
  links.models,
  links.promotions,
  links.information,
  links.service,
  links.warranty,
  links.about,
  links.contact,
]

export function SiteFooter() {
  const { t, lang, setLang } = useLanguage()
  const year = new Date().getFullYear()
  const [forgotten, setForgotten] = useState(false)

  return (
    <footer className="site-footer">
      <div className="container site-footer__top">
        <div className="site-footer__brand">
          <SolisLogo className="site-footer__logo" />
          <p>{t.footer.tagline}</p>
        </div>

        <nav className="site-footer__col" aria-label={t.footer.dealers}>
          <h2>{t.footer.dealers}</h2>
          <a href={links.dealers}>{t.footer.findDealer}</a>
          <a href={links.becomeDealer}>{t.footer.becomeDealer}</a>
        </nav>

        <nav className="site-footer__col" aria-label={t.footer.menu}>
          <h2>{t.footer.menu}</h2>
          {t.footer.links.map((label, i) => {
            const href = MENU[i] ?? links.models
            return (
              <a key={label} href={href}>
                {label}
              </a>
            )
          })}
        </nav>

        <address className="site-footer__col">
          <h2>{t.footer.company}</h2>
          <a href={links.phone}>
            <Phone />
            {t.utility.phone}
          </a>
          <a href={links.email}>
            <Mail />
            info@solistractor.nl
          </a>
          <a href={links.maps} target="_blank" rel="noopener noreferrer">
            <Pin />
            <span>
              {t.footer.address.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </span>
          </a>
        </address>
      </div>

      <div className="container site-footer__bottom">
        <p>
          © {year} Agrixpert · <a href={links.privacy}>{t.footer.privacy}</a> ·{' '}
          <a href={links.cookies}>{t.footer.cookies}</a>
        </p>
        <p>{t.footer.note}</p>
        <p className="site-footer__concept">{t.footer.concept}</p>
        {/* When both versions of the page are live, this is the way between them. */}
        {EDITIONS.length > 1 && (
          <nav className="site-footer__editions" aria-label={t.footer.editionNav}>
            <span>{t.footer.edition}</span>
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
        )}
        <button type="button" className="site-footer__lang" onClick={() => setLang(lang === 'nl' ? 'en' : 'nl')}>
          {lang === 'nl' ? 'English' : 'Nederlands'}
        </button>
        {/* Everything the page remembers lives in this browser; one press wipes it. */}
        <div className="site-footer__privacy">
          <p>{t.personal.stored}</p>
          <button
            type="button"
            className="site-footer__lang"
            onClick={() => {
              forgetEverything()
              setForgotten(true)
            }}
          >
            {t.personal.forget}
          </button>
          <p className="site-footer__privacy-status" role="status">
            {forgotten ? t.personal.forgotten : ''}
          </p>
        </div>
      </div>

      <div className="site-footer__mark" aria-hidden="true">
        <SolisLogo />
      </div>
    </footer>
  )
}
