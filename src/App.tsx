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
import { TechHotspots } from './sections/TechHotspots/TechHotspots'
import { Journey } from './sections/Journey/Journey'
import { Dealers } from './sections/Dealers/Dealers'
import { DemoRequest } from './sections/DemoRequest/DemoRequest'
import { EDITION } from './edition'
import { WelcomeBack } from './components/WelcomeBack/WelcomeBack'
import { ShortlistTray } from './components/Shortlist/ShortlistTray'
import { CompareDialog } from './components/Shortlist/CompareDialog'
import { ActionBar } from './components/ActionBar/ActionBar'

/**
 * The landing page, top to bottom. No router: it is one scroll in one of two
 * editions (edition.ts — `/` the film, `/studio` the first version), and every
 * deeper page (a model, a dealer, the forms) stays on solistractor.nl — see
 * data/links.ts.
 */
export default function App() {
  return (
    <>
      <Preloader />
      <SiteHeader />
      <main id="inhoud">
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
      <SiteFooter />
      <MotionToggle />
      <WelcomeBack />
      <ShortlistTray />
      <ActionBar />
      <CompareDialog />
      {/* Every model's full sheet, opened from the gallery, the compare table and the finder. */}
      <ModelSheet />
      {EDITION === 'studio' && <ScrollTractor />}
    </>
  )
}
