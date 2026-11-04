import { SITE } from './links'

export type Province =
  | 'Flevoland'
  | 'Friesland'
  | 'Gelderland'
  | 'Groningen'
  | 'Limburg'
  | 'Noord-Brabant'
  | 'Noord-Holland'
  | 'Overijssel'
  | 'Zeeland'
  | 'Zuid-Holland'

export interface Dealer {
  name: string
  town: string
  province: Province
  href: string
  importer?: boolean
}

const dealer = (slug: string) => `${SITE}/dealers/${slug}/`

/** The twenty sales and service points listed on solistractor.nl. */
export const dealers: Dealer[] = [
  { name: 'Solis Nederland · AgriXpert B.V.', town: 'Schipluiden', province: 'Zuid-Holland', href: dealer('agrixpert'), importer: true },
  { name: 'Joh. Bosgra B.V.', town: 'Hurdegaryp', province: 'Friesland', href: dealer('bosgra') },
  { name: 'Bosmans Machines B.V.', town: 'Neer', province: 'Limburg', href: dealer('bosmans-machines') },
  { name: 'Geelink IJzerwaren B.V.', town: 'Haaksbergen', province: 'Overijssel', href: dealer('geelink') },
  { name: 'Hof Mechanisatie', town: 'Oldemarkt', province: 'Overijssel', href: dealer('hof-mechanisatie') },
  { name: 'Hulst De Krim', town: 'De Krim', province: 'Overijssel', href: dealer('hulst-de-krim') },
  { name: 'Gebratech B.V.', town: 'Well (LB)', province: 'Limburg', href: dealer('gebratech') },
  { name: 'KS Machinery', town: 'Ouddorp', province: 'Zuid-Holland', href: dealer('ks-machinery') },
  { name: 'VM Service', town: 'Swifterbant', province: 'Flevoland', href: dealer('vm-service') },
  { name: 'Goedhart Minitractoren', town: 'Beneden-Leeuwen', province: 'Gelderland', href: dealer('goedhart') },
  { name: 'Folkertsma VOF', town: 'Bolsward', province: 'Friesland', href: dealer('folkertsma') },
  { name: 'Fruit Tuin Park', town: 'Rilland', province: 'Zeeland', href: dealer('fruit-tuin-park') },
  { name: 'PD van Hemert Reparatie en Servicebedrijf', town: 'Opijnen', province: 'Gelderland', href: dealer('pd-van-hemert') },
  { name: 'Niels Lubbers Tuin & Parkmachines', town: 'Ter Apel', province: 'Groningen', href: dealer('niels-lubbers') },
  { name: 'van Vijfeijken Machinery B.V.', town: 'Mariahout', province: 'Noord-Brabant', href: dealer('van-vijfeijken') },
  { name: 'Manshanden Trekkers en Werktuigen', town: 'Andijk', province: 'Noord-Holland', href: dealer('manshanden') },
  { name: 'Nouws Mechanisatie', town: 'Rijsbergen', province: 'Noord-Brabant', href: dealer('nouws') },
  { name: 'Arjan van Lierop Landbouwmechanisatie', town: 'Lisse', province: 'Zuid-Holland', href: dealer('arjan-van-lierop') },
  { name: 'Van der Mei Tractoren', town: 'Gorredijk', province: 'Friesland', href: dealer('van-der-mei') },
  { name: 'Romox Tuin en Park', town: 'Eersel', province: 'Noord-Brabant', href: dealer('romox') },
]

/** Provinces that actually have a dealer, alphabetically — the filter offers no empty choices. */
export const provinces: Province[] = [...new Set(dealers.map((d) => d.province))].sort((a, b) =>
  a.localeCompare(b, 'nl'),
)
