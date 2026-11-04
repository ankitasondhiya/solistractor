import type { Localized } from '../i18n/LanguageContext'
import { MEDIA, SITE } from './links'

export type Segment = 'compact' | 'mid' | 'narrow' | 'farm'
export type Use = 'yard' | 'grounds' | 'equestrian' | 'orchard' | 'farming' | 'loader'
export type Space = 'tight' | 'medium' | 'open'

export interface TractorModel {
  id: string
  name: string
  /** the name as the spec sheet sets it, e.g. "S50 Shuttle XL" */
  fullName: string
  hp: number
  segment: Segment
  /** the site's own label for the model, e.g. "Hydrostaat" */
  category: Localized
  /** the model's one-line promise on solistractor.nl/modellen */
  tagline: Localized
  /** on standard agricultural tyres, where the site publishes it */
  width: Localized | null
  pitch: Localized
  engine: Localized
  lift: Localized
  transmission: Localized
  pto: Localized
  /** starting price in euros, excluding VAT */
  price: number
  image: string
  href: string
  /**
   * How well the model suits each job, 0–3, and how comfortable it is in
   * each kind of space, 0–2. Read from the model's own positioning on the
   * site — "komt waar grotere tractoren niet kunnen komen", "voor boomgaard
   * en fruitteelt", "voorladerwerk" — and used only by the model finder.
   */
  uses: Record<Use, number>
  space: Record<Space, number>
}

const upload = (file: string) => `${MEDIA}/uploads/2026/08/${file}-1024x725.webp`
const page = (slug: string) => `${SITE}/modellen/${slug}/`
const same = (value: string): Localized => ({ nl: value, en: value })

/** All twelve models, as listed on solistractor.nl, in order of power. */
export const models: TractorModel[] = [
  {
    id: 's16',
    name: 'S16',
    fullName: 'S16',
    hp: 16,
    segment: 'compact',
    category: { nl: 'Compact', en: 'Compact' },
    tagline: { nl: 'Compacte kracht voor tuin, terrein en erf.', en: 'Compact power for garden, grounds and yard.' },
    width: { nl: '94,5 cm', en: '94.5 cm' },
    pitch: {
      nl: 'Met circa 95 cm breedte op standaard landbouwbanden komt de S16 waar grotere tractoren niet kunnen komen.',
      en: 'At around 95 cm wide on standard agricultural tyres, the S16 goes where bigger tractors cannot.',
    },
    engine: same('3-cil. ITL S-Tech Stage V'),
    lift: same('650 kg'),
    transmission: { nl: '6F + 2R mechanisch', en: '6F + 2R mechanical' },
    pto: { nl: '540 / 1000 tpm', en: '540 / 1000 rpm' },
    price: 6950,
    image: upload('s16-1'),
    href: page('s16'),
    uses: { yard: 3, grounds: 2, equestrian: 2, orchard: 0, farming: 0, loader: 1 },
    space: { tight: 2, medium: 1, open: 0 },
  },
  {
    id: 's20',
    name: 'S20',
    fullName: 'S20',
    hp: 18,
    segment: 'compact',
    category: { nl: 'Compact', en: 'Compact' },
    tagline: { nl: 'Wendbaar van formaat. Breed in gebruik.', en: 'Nimble in size. Broad in use.' },
    width: { nl: '92 cm', en: '92 cm' },
    pitch: {
      nl: 'Een compacte allroundtractor voor maaien, frezen, laden en werkzaamheden op beperkte ruimte.',
      en: 'A compact all-rounder for mowing, tilling, loading and work in confined spaces.',
    },
    engine: same('3-cil. Mitsubishi Stage V'),
    lift: same('650 kg'),
    transmission: { nl: '6F + 2R mechanisch', en: '6F + 2R mechanical' },
    pto: { nl: '540 / 1000 tpm', en: '540 / 1000 rpm' },
    price: 8050,
    image: upload('s20-1'),
    href: page('s20'),
    uses: { yard: 3, grounds: 3, equestrian: 2, orchard: 0, farming: 0, loader: 1 },
    space: { tight: 2, medium: 1, open: 0 },
  },
  {
    id: 's22',
    name: 'S22',
    fullName: 'S22',
    hp: 22,
    segment: 'compact',
    category: { nl: 'Compact', en: 'Compact' },
    tagline: { nl: 'Meer vermogen in een compact pakket.', en: 'More power in a compact package.' },
    width: { nl: '106 cm', en: '106 cm' },
    pitch: {
      nl: 'De S22 combineert compacte afmetingen met een sterke driepuntshef en Stage V-techniek.',
      en: 'The S22 pairs compact dimensions with a strong three-point linkage and Stage V technology.',
    },
    engine: same('3-cil. ITL S-Tech Stage V'),
    lift: same('750 kg'),
    transmission: { nl: '6F + 2R mechanisch', en: '6F + 2R mechanical' },
    pto: { nl: '540 / 1000 tpm', en: '540 / 1000 rpm' },
    price: 8150,
    image: upload('s22-1'),
    href: page('s22'),
    uses: { yard: 3, grounds: 2, equestrian: 2, orchard: 0, farming: 1, loader: 2 },
    space: { tight: 2, medium: 2, open: 0 },
  },
  {
    id: 's26',
    name: 'S26',
    fullName: 'S26',
    hp: 26,
    segment: 'compact',
    category: { nl: 'Mechanisch', en: 'Mechanical' },
    tagline: { nl: 'De compacte krachtpatser voor iedere dag.', en: 'The compact workhorse for every day.' },
    width: { nl: '106 cm', en: '106 cm' },
    pitch: {
      nl: 'Mitsubishi-motortechniek, een zware vooras en veelzijdige uitrusting voor compact werk.',
      en: 'Mitsubishi engine technology, a heavy front axle and versatile equipment for compact work.',
    },
    engine: same('3-cil. Mitsubishi Stage V'),
    lift: same('775 kg'),
    transmission: { nl: '6F + 2R mechanisch', en: '6F + 2R mechanical' },
    pto: { nl: '540 / 1000 tpm', en: '540 / 1000 rpm' },
    price: 10150,
    image: upload('s26-1'),
    href: page('s26'),
    uses: { yard: 2, grounds: 3, equestrian: 2, orchard: 1, farming: 1, loader: 2 },
    space: { tight: 1, medium: 2, open: 1 },
  },
  {
    id: 's26-shuttle-xl',
    name: 'S26 Shuttle XL',
    fullName: 'S26 Shuttle XL',
    hp: 26,
    segment: 'compact',
    category: { nl: '9+9 shuttle', en: '9+9 shuttle' },
    tagline: { nl: 'Compact werken met het gemak van een shuttle.', en: 'Compact work with the ease of a shuttle.' },
    width: { nl: '119 cm', en: '119 cm' },
    pitch: {
      nl: 'De 9+9-transmissie met omkeerschakeling ondersteunt herhaald manoeuvreren en voorladerwerk.',
      en: 'The 9+9 transmission with shuttle reverser makes light work of repeated manoeuvring and loader work.',
    },
    engine: same('3-cil. Mitsubishi Stage V'),
    lift: same('775 kg'),
    transmission: same('9F + 9R shuttle'),
    pto: { nl: '540 / 540E tpm', en: '540 / 540E rpm' },
    price: 11250,
    image: upload('s26-shuttle-1'),
    href: page('s26-shuttle-xl'),
    uses: { yard: 2, grounds: 2, equestrian: 3, orchard: 1, farming: 1, loader: 3 },
    space: { tight: 1, medium: 2, open: 1 },
  },
  {
    id: 'h26',
    name: 'H26',
    fullName: 'H26',
    hp: 26,
    segment: 'compact',
    category: { nl: 'Hydrostaat', en: 'Hydrostatic' },
    tagline: { nl: 'Traploos comfortabel en precies te bedienen.', en: 'Stepless, comfortable and precise to drive.' },
    width: { nl: '119 cm', en: '119 cm' },
    pitch: {
      nl: 'De hydrostatische aandrijving met twee pedalen maakt de H26 toegankelijk en nauwkeurig bij veel wisselend rijwerk.',
      en: 'Two-pedal hydrostatic drive makes the H26 easy and precise for work with constant changes of direction.',
    },
    engine: same('3-cil. Mitsubishi Stage V'),
    lift: same('750 kg'),
    transmission: { nl: '2-groeps hydrostaat', en: '2-range hydrostatic' },
    pto: { nl: '540 / 2100 tpm', en: '540 / 2100 rpm' },
    price: 11850,
    image: upload('h26-1'),
    href: page('h26'),
    uses: { yard: 2, grounds: 3, equestrian: 3, orchard: 0, farming: 0, loader: 2 },
    space: { tight: 2, medium: 2, open: 0 },
  },
  {
    id: 's50',
    name: 'S50',
    fullName: 'S50 Shuttle XL',
    hp: 50,
    segment: 'mid',
    category: { nl: 'Shuttle XL', en: 'Shuttle XL' },
    tagline: { nl: 'Een volwassen landbouwtractor met compacte souplesse.', en: 'A full-size farm tractor with compact agility.' },
    width: null,
    pitch: {
      nl: 'De S50 biedt een Stage V-motor, shuttle-transmissie en 2.500 kg hefvermogen voor breed dagelijks gebruik.',
      en: 'The S50 brings a Stage V engine, shuttle transmission and 2,500 kg of lift for broad everyday use.',
    },
    engine: same('3-cil. CRDi Stage V'),
    lift: { nl: '2.500 kg', en: '2,500 kg' },
    transmission: same('12F + 12R shuttle'),
    pto: { nl: '540 / 540E tpm', en: '540 / 540E rpm' },
    price: 21725,
    image: upload('s50-1'),
    href: page('s50'),
    uses: { yard: 1, grounds: 2, equestrian: 2, orchard: 0, farming: 2, loader: 3 },
    space: { tight: 0, medium: 2, open: 2 },
  },
  {
    id: 's60',
    name: 'S60',
    fullName: 'S60 Shuttle XL',
    hp: 58,
    segment: 'mid',
    category: { nl: 'Shuttle XL', en: 'Shuttle XL' },
    tagline: { nl: 'Meer reserve voor het zwaardere werk.', en: 'More in reserve for heavier work.' },
    width: null,
    pitch: {
      nl: 'De S60 deelt zijn basis met de S50 en zet daar 58 pk en 250 Nm koppel tegenover, met ROPS of cabine.',
      en: 'The S60 shares its base with the S50 and adds 58 hp and 250 Nm of torque, with ROPS or a cab.',
    },
    engine: same('3-cil. CRDi Stage V'),
    lift: { nl: '2.500 kg', en: '2,500 kg' },
    transmission: same('12F + 12R shuttle'),
    pto: { nl: '540 / 540E tpm', en: '540 / 540E rpm' },
    price: 23475,
    image: upload('s60-1'),
    href: page('s60'),
    uses: { yard: 1, grounds: 1, equestrian: 2, orchard: 0, farming: 3, loader: 3 },
    space: { tight: 0, medium: 2, open: 2 },
  },
  {
    id: 'n75',
    name: 'N75',
    fullName: 'N75',
    hp: 75,
    segment: 'narrow',
    category: { nl: 'Smalspoor', en: 'Narrow track' },
    tagline: { nl: 'Smal gebouwd voor werk tussen de rijen.', en: 'Built narrow for work between the rows.' },
    width: null,
    pitch: {
      nl: 'De N75 combineert 75 pk met een smalle, lage bouw voor boomgaard, fruitteelt en andere specialistische toepassingen.',
      en: 'The N75 pairs 75 hp with a narrow, low build for orchards, fruit growing and other specialist work.',
    },
    engine: same('4-cil. CRDi Stage V'),
    lift: { nl: '2.500 kg', en: '2,500 kg' },
    transmission: { nl: 'Gesynchroniseerde shuttle', en: 'Synchromesh shuttle' },
    pto: { nl: '540 / 540E tpm', en: '540 / 540E rpm' },
    price: 30850,
    image: upload('n75-1'),
    href: page('n75'),
    uses: { yard: 0, grounds: 1, equestrian: 0, orchard: 3, farming: 1, loader: 1 },
    space: { tight: 2, medium: 1, open: 1 },
  },
  {
    id: 's75',
    name: 'S75',
    fullName: 'S75',
    hp: 75,
    segment: 'farm',
    category: { nl: 'Shuttle XL', en: 'Shuttle XL' },
    tagline: { nl: 'Kracht die werkt. Comfort dat blijft.', en: 'Power that works. Comfort that lasts.' },
    width: null,
    pitch: {
      nl: 'Een veelzijdige 75 pk tractor voor landbouw, erfwerk en voorladerwerk.',
      en: 'A versatile 75 hp tractor for farming, yard work and front-loader work.',
    },
    engine: same('4-cil. ITL CRDi Stage V'),
    lift: { nl: '2.500 kg (3.000 kg optie)', en: '2,500 kg (3,000 kg option)' },
    transmission: same('12F + 12R shuttle'),
    pto: { nl: '540 / 540E tpm', en: '540 / 540E rpm' },
    price: 29250,
    image: `${MEDIA}/uploads/2026/08/s75-1024x725.webp`,
    href: page('s75'),
    uses: { yard: 1, grounds: 1, equestrian: 1, orchard: 0, farming: 3, loader: 3 },
    space: { tight: 0, medium: 1, open: 2 },
  },
  {
    id: 'n90',
    name: 'N90',
    fullName: 'N90',
    hp: 90,
    segment: 'narrow',
    category: { nl: 'Smalspoor', en: 'Narrow track' },
    tagline: { nl: 'Maximaal vermogen op minimale breedte.', en: 'Maximum power at minimum width.' },
    width: null,
    pitch: {
      nl: 'De N90 is ontwikkeld voor gebruikers die in smalle rijen veel vermogen, hydrauliek en hefkracht nodig hebben.',
      en: 'The N90 is built for growers who need plenty of power, hydraulics and lift in narrow rows.',
    },
    engine: same('4-cil. CRDi Stage V'),
    lift: { nl: '2.500 kg', en: '2,500 kg' },
    transmission: { nl: 'Gesynchroniseerde shuttle', en: 'Synchromesh shuttle' },
    pto: { nl: '540 / 540E tpm', en: '540 / 540E rpm' },
    price: 35900,
    image: upload('n90-1'),
    href: page('n90'),
    uses: { yard: 0, grounds: 0, equestrian: 0, orchard: 3, farming: 2, loader: 1 },
    space: { tight: 2, medium: 1, open: 1 },
  },
  {
    id: 's90',
    name: 'S90',
    fullName: 'S90',
    hp: 90,
    segment: 'farm',
    category: { nl: 'Landbouw', en: 'Agricultural' },
    tagline: { nl: 'Meer vermogen voor het zware werk.', en: 'More power for heavy work.' },
    width: null,
    pitch: {
      nl: 'De S90 combineert een CRDi Stage V-motor met een robuuste transmissie en grote hefkracht.',
      en: 'The S90 combines a CRDi Stage V engine with a rugged transmission and serious lifting power.',
    },
    engine: same('4-cil. CRDi Stage V'),
    lift: { nl: '3.000 kg (3.500 kg optie)', en: '3,000 kg (3,500 kg option)' },
    transmission: same('12F + 12R / 20F + 20R'),
    pto: { nl: '540 / 540E tpm', en: '540 / 540E rpm' },
    price: 31750,
    image: upload('s90-1'),
    href: page('s90'),
    uses: { yard: 0, grounds: 0, equestrian: 1, orchard: 0, farming: 3, loader: 2 },
    space: { tight: 0, medium: 1, open: 2 },
  },
]

export const segments: Segment[] = ['compact', 'mid', 'narrow', 'farm']
export const MAX_HP = 90

/**
 * The power span of a segment — "16–26 pk" — shown on every segment filter,
 * so the four groups explain themselves: three are sized by power, and
 * Smalspoor / Narrow track is the N-series' narrow, low build.
 */
export function segmentRange(segment: Segment, lang: 'nl' | 'en'): string {
  const hp = models.filter((m) => m.segment === segment).map((m) => m.hp)
  const lo = Math.min(...hp)
  const hi = Math.max(...hp)
  const unit = lang === 'nl' ? 'pk' : 'hp'
  return lo === hi ? `${lo} ${unit}` : `${lo}–${hi} ${unit}`
}

/**
 * The site's own label for a model — "26 pk · Hydrostaat", "26 hp ·
 * Hydrostatic" — which is what tells the three 26 hp tractors apart.
 */
export function modelBadge(model: TractorModel, lang: 'nl' | 'en'): string {
  return `${model.hp} ${lang === 'nl' ? 'pk' : 'hp'} · ${model.category[lang]}`
}

/** "€ 6.950,-" in Dutch, "€6,950" in English — the way each market writes it. */
export function formatPrice(value: number, lang: 'nl' | 'en'): string {
  if (lang === 'nl') return `€ ${value.toLocaleString('nl-NL')},-`
  return `€${value.toLocaleString('en-GB')}`
}

export interface Recommendation {
  model: TractorModel
  /** 0..1 */
  score: number
}

/**
 * The model finder's whole logic: a weighted fit of the job (twice as
 * important) and the space, ties broken by the lower price — the smallest
 * machine that does the job well is the honest recommendation.
 */
export function recommend(use: Use, space: Space | null, limit = 3): Recommendation[] {
  const max = 3 * 2 + (space ? 2 : 0)
  return models
    .map((model) => ({
      model,
      score: (model.uses[use] * 2 + (space ? model.space[space] : 0)) / max,
    }))
    .filter((r) => r.model.uses[use] > 0)
    .sort((a, b) => b.score - a.score || a.model.price - b.model.price)
    .slice(0, limit)
}
