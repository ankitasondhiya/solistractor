/**
 * Where the redesigned home page hands off to the existing site.
 *
 * The landing page is the only page rebuilt here; model pages, dealer pages
 * and forms stay on solistractor.nl, so every outbound link is collected in
 * one place to be re-pointed when the rest of the site follows.
 */
export const SITE = 'https://www.solistractor.nl'

/**
 * Product photography is the site's own, served from its WordPress uploads.
 * Swap this for a local folder (e.g. '/media/models') once the images are
 * copied into the project.
 */
export const MEDIA = `${SITE}/wp-content`

export const links = {
  models: `${SITE}/modellen/`,
  finder: `${SITE}/keuzehulp/`,
  compare: `${SITE}/vergelijken/`,
  dealers: `${SITE}/dealers/`,
  information: `${SITE}/informatie/`,
  service: `${SITE}/klantenservice/`,
  warranty: `${SITE}/garantie/`,
  about: `${SITE}/over-ons/`,
  contact: `${SITE}/contact/`,
  becomeDealer: `${SITE}/contact/?onderwerp=dealer`,
  privacy: `${SITE}/privacybeleid/`,
  cookies: `${SITE}/cookiebeleid/`,
  phone: 'tel:+31155150070',
  email: 'mailto:info@solistractor.nl',
  maps: 'https://maps.app.goo.gl/C9KGSUYa9cZ7WYVE7',
} as const

/** The site's own photographs, used by the studio edition (`/studio`). */
export const media = {
  farmyard: `${MEDIA}/themes/solis/assets/hero.webp`,
  detail: `${MEDIA}/themes/solis/assets/detail.webp`,
} as const
