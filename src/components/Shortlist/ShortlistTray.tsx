import { useEffect, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'

import { useLanguage } from '../../i18n/LanguageContext'
import { models } from '../../data/models'
import { SHORTLIST_FULL, toggleShortlist, usePersonal } from '../../personal/personal'
import { imageIn, openModelSheet } from '../../sections/ModelSheet/sheetBus'
import { ArrowRight, Close, Heart } from '../Icons'
import { openCompare } from './compareBus'
import './shortlist.css'

/**
 * Desktop: the shortlist as a small tray at the foot of the screen — the saved
 * tractors as thumbnails (each opens its sheet, each can be removed) and the
 * way into the side-by-side comparison. Appears with the first saved model,
 * thumbnails slide into place as models come and go, and a refused fourth
 * model is explained here. Phones reach the shortlist from the action bar.
 */
export function ShortlistTray() {
  const { t } = useLanguage()
  const { shortlist } = usePersonal()
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    let timer = 0
    const onFull = () => {
      setNotice(t.shortlist.full)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setNotice(null), 4500)
    }
    window.addEventListener(SHORTLIST_FULL, onFull)
    return () => {
      window.removeEventListener(SHORTLIST_FULL, onFull)
      window.clearTimeout(timer)
    }
  }, [t])

  const saved = shortlist.map((id) => models.find((x) => x.id === id)).filter((x) => x !== undefined)

  return (
    <div className="tray-region">
      <AnimatePresence>
        {saved.length > 0 && (
          <m.section
            key="tray"
            className="tray"
            aria-labelledby="tray-title"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16, transition: { duration: 0.24, ease: [0.7, 0, 0.84, 0] } }}
          >
            <h2 id="tray-title" className="tray__title">
              <Heart className="tray__heart" aria-hidden="true" />
              {t.shortlist.title}
            </h2>
            <ul className="tray__items">
              <AnimatePresence initial={false}>
                {saved.map((x) => (
                  <m.li
                    key={x.id}
                    layout="position"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.18 } }}
                    className="tray__item"
                  >
                    <button
                      type="button"
                      className="tray__thumb"
                      title={`Solis ${x.fullName}`}
                      onClick={(e) => openModelSheet(x.id, 'overview', imageIn(e.currentTarget))}
                    >
                      <img src={x.image} alt="" width={1024} height={725} decoding="async" />
                      <span>{x.name.replace(' Shuttle XL', '')}</span>
                      <span className="visually-hidden">Solis {x.fullName}</span>
                    </button>
                    <button
                      type="button"
                      className="tray__remove"
                      aria-label={t.shortlist.remove(x.fullName)}
                      onClick={() => toggleShortlist(x.id)}
                    >
                      <Close />
                    </button>
                  </m.li>
                ))}
              </AnimatePresence>
            </ul>
            {saved.length > 1 ? (
              <button type="button" className="btn btn--sm tray__compare" onClick={openCompare}>
                {t.shortlist.compareCount(saved.length)}
                <ArrowRight className="btn__icon" />
              </button>
            ) : (
              <p className="tray__hint">{t.shortlist.addMore}</p>
            )}
            <p className="tray__notice" role="status">
              {notice ?? ''}
            </p>
          </m.section>
        )}
      </AnimatePresence>
    </div>
  )
}
