import { useEffect, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import './welcome-back.css'

import { useLanguage } from '../../i18n/LanguageContext'
import { useMotion } from '../../motion/MotionContext'
import { afterLoaded } from '../../motion/preload'
import { models } from '../../data/models'
import { byDistance } from '../../data/dealers'
import { dismissReturning, getPersonal, usePersonal } from '../../personal/personal'
import { openModelSheet } from '../../sections/ModelSheet/sheetBus'
import { ArrowRight, Close, Pin } from '../Icons'

/**
 * A returning reader gets a short note, under the header, once the preloader lifts: the tractor
 * they last opened, one press away, and the dealer nearest to the place they
 * gave last time. It never takes focus (it is announced politely), it stays
 * until answered or closed, and it doesn't come back during this visit.
 */
export function WelcomeBack() {
  const { t } = useLanguage()
  const { scrollTo } = useMotion()
  const personal = usePersonal()
  const [ready, setReady] = useState(false)

  // Decided once, at the start of the visit — not re-shown by later choices.
  useEffect(() => {
    if (!getPersonal().returning) return undefined
    return afterLoaded(() => setReady(true), 1400)
  }, [])

  const model = models.find((x) => x.id === personal.viewed[0])
  const near = personal.place ? byDistance(personal.place)[0] : undefined
  const visible = ready && personal.returning && (model !== undefined || near !== undefined)

  const close = () => dismissReturning()

  return (
    <div className="welcome-region" aria-live="polite">
      <AnimatePresence>
        {visible && (
          <m.aside
            key="welcome"
            className="welcome"
            aria-labelledby="welcome-title"
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, transition: { duration: 0.24, ease: [0.7, 0, 0.84, 0] } }}
          >
            {model && (
              <span className="welcome__thumb" aria-hidden="true">
                <img src={model.image} alt="" width={1024} height={725} decoding="async" />
              </span>
            )}
            <div className="welcome__body">
              <p id="welcome-title" className="welcome__title">
                {t.personal.welcome}
              </p>
              {model && <p className="welcome__text">{t.personal.continueWith(model.fullName)}</p>}
              {near && (
                <p className="welcome__dealer">
                  <Pin aria-hidden="true" />
                  <span>
                    {t.personal.yourDealer}: <strong>{near.dealer.name}</strong> · {t.dealers.locate.km(near.km)}
                  </span>
                </p>
              )}
              <div className="welcome__actions">
                {model ? (
                  <button
                    type="button"
                    className="btn btn--sm"
                    onClick={() => {
                      close()
                      openModelSheet(model.id)
                    }}
                  >
                    {t.personal.open(model.name)}
                    <ArrowRight className="btn__icon" />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn--sm"
                    onClick={() => {
                      close()
                      scrollTo('#dealers', { offset: -24 })
                    }}
                  >
                    {t.personal.seeDealers}
                    <ArrowRight className="btn__icon" />
                  </button>
                )}
              </div>
            </div>
            <button type="button" className="welcome__close" aria-label={t.personal.dismiss} onClick={close}>
              <Close />
            </button>
          </m.aside>
        )}
      </AnimatePresence>
    </div>
  )
}
