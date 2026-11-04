import { SITE } from './links'
import { distanceKm } from '../personal/personal'

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
  /** the town's centre (PDOK Locatieserver), for "nearest dealer" */
  lat: number
  lng: number
  importer?: boolean
}

const dealer = (slug: string) => `${SITE}/dealers/${slug}/`

/** The twenty sales and service points listed on solistractor.nl. */
export const dealers: Dealer[] = [
  { name: 'Solis Nederland · AgriXpert B.V.', town: 'Schipluiden', province: 'Zuid-Holland', href: dealer('agrixpert'), lat: 51.9737, lng: 4.3253, importer: true },
  { name: 'Joh. Bosgra B.V.', town: 'Hurdegaryp', province: 'Friesland', href: dealer('bosgra'), lat: 53.2146, lng: 5.9522 },
  { name: 'Bosmans Machines B.V.', town: 'Neer', province: 'Limburg', href: dealer('bosmans-machines'), lat: 51.2726, lng: 5.9754 },
  { name: 'Geelink IJzerwaren B.V.', town: 'Haaksbergen', province: 'Overijssel', href: dealer('geelink'), lat: 52.1555, lng: 6.7559 },
  { name: 'Hof Mechanisatie', town: 'Oldemarkt', province: 'Overijssel', href: dealer('hof-mechanisatie'), lat: 52.8254, lng: 5.9572 },
  { name: 'Hulst De Krim', town: 'De Krim', province: 'Overijssel', href: dealer('hulst-de-krim'), lat: 52.6527, lng: 6.6198 },
  { name: 'Gebratech B.V.', town: 'Well (LB)', province: 'Limburg', href: dealer('gebratech'), lat: 51.5671, lng: 6.0982 },
  { name: 'KS Machinery', town: 'Ouddorp', province: 'Zuid-Holland', href: dealer('ks-machinery'), lat: 51.7983, lng: 3.8889 },
  { name: 'VM Service', town: 'Swifterbant', province: 'Flevoland', href: dealer('vm-service'), lat: 52.5877, lng: 5.6276 },
  { name: 'Goedhart Minitractoren', town: 'Beneden-Leeuwen', province: 'Gelderland', href: dealer('goedhart'), lat: 51.8732, lng: 5.5165 },
  { name: 'Folkertsma VOF', town: 'Bolsward', province: 'Friesland', href: dealer('folkertsma'), lat: 53.0641, lng: 5.5246 },
  { name: 'Fruit Tuin Park', town: 'Rilland', province: 'Zeeland', href: dealer('fruit-tuin-park'), lat: 51.4231, lng: 4.198 },
  { name: 'PD van Hemert Reparatie en Servicebedrijf', town: 'Opijnen', province: 'Gelderland', href: dealer('pd-van-hemert'), lat: 51.8304, lng: 5.3078 },
  { name: 'Niels Lubbers Tuin & Parkmachines', town: 'Ter Apel', province: 'Groningen', href: dealer('niels-lubbers'), lat: 52.8829, lng: 7.0785 },
  { name: 'van Vijfeijken Machinery B.V.', town: 'Mariahout', province: 'Noord-Brabant', href: dealer('van-vijfeijken'), lat: 51.5441, lng: 5.5701 },
  { name: 'Manshanden Trekkers en Werktuigen', town: 'Andijk', province: 'Noord-Holland', href: dealer('manshanden'), lat: 52.7519, lng: 5.2125 },
  { name: 'Nouws Mechanisatie', town: 'Rijsbergen', province: 'Noord-Brabant', href: dealer('nouws'), lat: 51.5149, lng: 4.6985 },
  { name: 'Arjan van Lierop Landbouwmechanisatie', town: 'Lisse', province: 'Zuid-Holland', href: dealer('arjan-van-lierop'), lat: 52.2556, lng: 4.5458 },
  { name: 'Van der Mei Tractoren', town: 'Gorredijk', province: 'Friesland', href: dealer('van-der-mei'), lat: 52.9949, lng: 6.0647 },
  { name: 'Romox Tuin en Park', town: 'Eersel', province: 'Noord-Brabant', href: dealer('romox'), lat: 51.3484, lng: 5.3132 },
]

/** Provinces that actually have a dealer, alphabetically — the filter offers no empty choices. */
export const provinces: Province[] = [...new Set(dealers.map((d) => d.province))].sort((a, b) =>
  a.localeCompare(b, 'nl'),
)

export interface DealerDistance {
  dealer: Dealer
  /** straight-line km, rounded */
  km: number
}

/** Dealers nearest first, from a point the reader chose. */
export function byDistance(from: { lat: number; lng: number }, list: Dealer[] = dealers): DealerDistance[] {
  return list
    .map((dealer) => ({ dealer, km: Math.round(distanceKm(from, dealer)) }))
    .sort((a, b) => a.km - b.km)
}
