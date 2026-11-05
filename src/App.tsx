import { lazy, Suspense, useEffect, useLayoutEffect, useRef } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import { Preloader } from './components/Preloader/Preloader'
import { MotionToggle, SiteHeader } from './components/SiteHeader/SiteHeader'
import { SiteFooter } from './components/SiteFooter/SiteFooter'
import { ScrollTractor } from './components/ScrollTractor/ScrollTractor'
import { FilmHero } from './sections/FilmHero/FilmHero'
import { StudioHero } from './sections/StudioHero/StudioHero'
import { Marquee } from './sections/Marquee/Marquee'
import { Statement } from './sections/Statement/Statement'
import { Pillars } from './sections/Pillars/Pillars'
import { ModelGallery } from './sections/ModelGallery/ModelGallery'
import { ModelFinder } from './sections/ModelFinder/ModelFinder'
import { CompareTable } from './sections/CompareTable/CompareTable'
import { ModelSheet } from './sections/ModelSheet/ModelSheet'
import { openModelSheet } from './sections/ModelSheet/sheetBus'
import { TechHotspots } from './sections/TechHotspots/TechHotspots'
import { Journey } from './sections/Journey/Journey'
import { Dealers } from './sections/Dealers/Dealers'
import { DemoRequest } from './sections/DemoRequest/DemoRequest'
import { EDITION } from './edition'
import { WelcomeBack } from './components/WelcomeBack/WelcomeBack'
import { ShortlistTray } from './components/Shortlist/ShortlistTray'
import { CompareDialog } from './components/Shortlist/CompareDialog'
import { ActionBar } from './components/ActionBar/ActionBar'
import { useLanguage } from './i18n/LanguageContext'
import { useMotion } from './motion/MotionContext'
import { afterLoaded } from './motion/preload'
import { DEALER_SLUGS } from './data/dealers'
import { landingScrollY, matchRoute, onArrive, usePath } from './router'

// The deeper pages (about, service, warranty, contact, dealers…) load on first use.
const ContentRoute = lazy(() => import('./pages/ContentRoute'))

/**
 * The landing page, top to bottom, in one of two editions (edition.ts). For
 * now only the studio edition is live, at `/`; the film edition is parked.
 */
function Landing({ hidden }: { hidden: boolean }) {
  return (
    <>
      <Preloader />
      <main id={hidden ? undefined : 'inhoud'} hidden={hidden}>
        {/* 01 — the tractor, built as you scroll */}
        {EDITION === 'film' ? <FilmHero /> : <StudioHero />}
        <Marquee />
        {/* 02 — what Solis is, in one sentence and four reasons */}
        <Statement />
        <Pillars />
        {/* 03 — the range, and which of it fits */}
        <ModelGallery />
        <CompareTable />
        <ModelFinder />
        {/* 04 — the machine up close */}
        <TechHotspots />
        {/* 05 — who builds it, and how you get one */}
        <Journey />
        <Dealers />
        <DemoRequest />
      </main>
      {EDITION === 'studio' && !hidden && <ScrollTractor />}
    </>
  )
}

/**
 * The site: the landing page, and every page that used to live on
 * solistractor.nl (src/router.ts). The landing page mounts the first time it
 * is shown and then stays — hidden while another page is open — so going
 * back finds it exactly as it was, scroll position, ring and form included.
 */
export default function App() {
  const { t } = useLanguage()
  const { scrollTo } = useMotion()
  const path = usePath()
  const route = matchRoute(path, DEALER_SLUGS)
  const onLanding = route.kind === 'landing'

  // Mounted once it has been shown; a visit that starts on another page has no preloader.
  const landingShown = useRef(onLanding)
  const firstLanding = onLanding && !landingShown.current
  if (onLanding) landingShown.current = true
  const startedElsewhere = useRef(!onLanding)
  if (startedElsewhere.current && !onLanding && document.documentElement.dataset.loaded !== 'true') {
    document.documentElement.dataset.loaded = 'true'
  }

  // Arriving on the landing page for the first time from another page: its
  // preloader runs, and anything waiting for it waits again.
  useLayoutEffect(() => {
    if (firstLanding) delete document.documentElement.dataset.loaded
  }, [firstLanding])

  useEffect(() => {
    document.documentElement.dataset.route = route.kind
    if (onLanding) document.title = t.meta.title
  }, [route.kind, onLanding, t])

  // After every navigation: a page starts at its top; the landing page goes to
  // the section asked for, opens a model's sheet, or — coming back — returns
  // to where the reader left it.
  useEffect(
    () =>
      onArrive(({ hash, samePath, fromHistory }) => {
        const now = matchRoute(window.location.pathname, DEALER_SLUGS)
        if (now.kind !== 'landing') {
          if (hash) scrollTo(hash, { offset: -24, immediate: !samePath })
          else if (!samePath) scrollTo(0, { immediate: true })
          return
        }
        afterLoaded(
          () => {
            ScrollTrigger.refresh()
            if (hash.startsWith('#model-')) {
              if (!samePath) scrollTo(landingScrollY(), { immediate: true })
              openModelSheet(hash.slice('#model-'.length))
            } else if (hash) scrollTo(hash, { offset: hash === '#top' ? 0 : -24, immediate: !samePath })
            else if (samePath) scrollTo(0)
            else scrollTo(fromHistory ? landingScrollY() : 0, { immediate: true })
          },
          samePath ? 0 : 80,
        )
      }),
    [scrollTo],
  )

  return (
    <>
      <SiteHeader />
      {landingShown.current && <Landing hidden={!onLanding} />}
      {!onLanding && (
        <main id="inhoud">
          <Suspense fallback={<div className="cpage-fallback" />}>
            <ContentRoute key={path} route={route} />
          </Suspense>
        </main>
      )}
      <SiteFooter />
      <MotionToggle />
      <WelcomeBack />
      <ShortlistTray />
      <ActionBar />
      <CompareDialog />
      {/* Every model's full sheet, opened from the gallery, the compare table, the finder and the pages. */}
      <ModelSheet />
    </>
  )
}
