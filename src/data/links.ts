/**
 * Where links go. Everything that used to live on solistractor.nl is now a
 * page or a section of this site (src/router.ts), so a reader never has to
 * leave: the deeper pages have their own paths, "models", "dealers" and the
 * like are sections of the landing page ("/#dealers").
 *
 * The content of those pages comes from solistractor.nl as published — see
 * scripts/scrape-pages.py and scripts/scrape-catalogue.py.
 */
export const SOURCE = 'https://www.solistractor.nl'

/**
 * Photography, maps and PDFs, copied from the site's WordPress uploads into
 * public/media/solis by scripts/localize-media.py (same paths below it).
 */
export const MEDIA = '/media/solis'

export const links = {
  home: '/',
  models: '/#modellen',
  finder: '/#keuzehulp',
  compare: '/#vergelijken',
  dealers: '/#dealers',
  demo: '/#demo',
  information: '/informatie',
  service: '/klantenservice',
  warranty: '/garantie',
  warrantyForm: '/garantie/registreren',
  about: '/over-ons',
  contact: '/contact',
  becomeDealer: '/contact?onderwerp=dealer',
  privacy: '/privacybeleid',
  cookies: '/cookiebeleid',
  priceList: `${MEDIA}/uploads/2026/08/Solis-prijslijst.pdf`,
  brochure: `${MEDIA}/uploads/2026/08/Solis-brochure.pdf`,
  phone: 'tel:+31155150070',
  email: 'mailto:info@solistractor.nl',
  maps: 'https://maps.app.goo.gl/C9KGSUYa9cZ7WYVE7',
} as const

/** The site's own photographs, used by the studio edition (`/studio`). */
export const media = {
  farmyard: `${MEDIA}/themes/solis/assets/hero.webp`,
  detail: `${MEDIA}/themes/solis/assets/detail.webp`,
} as const
