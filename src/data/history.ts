import type { Localized } from '../i18n/LanguageContext'

/**
 * The history of ITL — the maker of Solis — told as a story of innovation:
 * the founder, the first machine, and every step since, from implements in
 * 1969 to Stage V tractors and an export plant in 2025.
 *
 * Only what the company and its documented sources state, in this site's
 * own words (nothing copied verbatim, nothing added):
 *   the timeline         solisworld.com/our-history  (ITL's own history)
 *   today's figures      solisworld.com/about-solis
 *   the founder          sonalika.com/about-us.html  (ITL's group site)
 *   "lines of gold"      Forbes, profile of Lachhman Das Mittal
 * Where sources differ on a date the company's history page is followed
 * (first tractor 1995, Hoshiarpur plant 1996). Figures it states loosely
 * are left out rather than guessed at.
 *
 * Photographs: solisworld.com/our-history, copied to
 * public/media/solisworld/history/ (resized WebP).
 */

const IMG = '/media/solisworld/history'

/** The four strands every milestone belongs to. */
export type Thread = 'machines' | 'factory' | 'partners' | 'world'

export const THREADS: Thread[] = ['machines', 'factory', 'partners', 'world']

export const threadLabel: Record<Thread | 'all', Localized> = {
  all: { nl: 'Alles', en: 'All' },
  machines: { nl: 'Machines', en: 'Machines' },
  factory: { nl: 'Fabrieken & techniek', en: 'Factories & engineering' },
  partners: { nl: 'Partners', en: 'Partners' },
  world: { nl: 'Wereld', en: 'World' },
}

export interface HistoryImage {
  src: string
  width: number
  height: number
  alt: Localized
  /** a product cut out of its background, shown whole; or a photograph, cropped to fill */
  kind: 'cutout' | 'photo'
}

export interface Milestone {
  year: number
  thread: Thread
  title: Localized
  text: Localized
  image?: HistoryImage
  /** the step that brought Solis to the Netherlands */
  home?: boolean
}

export const MILESTONES: Milestone[] = [
  {
    year: 1969,
    thread: 'machines',
    title: { nl: 'Eerst de werktuigen', en: 'Implements first' },
    text: {
      nl: 'L.D. Mittal richt ITL Group op om landbouwwerktuigen te bouwen, zoals de Sonalika-dorsmachine — om nieuwe techniek naar de boer te brengen.',
      en: 'L.D. Mittal founds ITL Group to build farm implements, such as the Sonalika thresher — to bring new technology to farmers.',
    },
  },
  {
    year: 1995,
    thread: 'machines',
    title: { nl: 'De eerste tractor', en: 'The first tractor' },
    text: {
      nl: 'De eerste tractor wordt geassembleerd: het begin van de tak die het bedrijf zou bepalen — tractoren bouwen.',
      en: 'The first tractor is assembled: the start of the business that would come to define the company — building tractors.',
    },
  },
  {
    year: 1996,
    thread: 'factory',
    title: { nl: 'Hoshiarpur gaat draaien', en: 'Hoshiarpur opens' },
    text: {
      nl: 'De fabriek in Hoshiarpur, Punjab, start de productie. Hier worden de tractoren voortaan gebouwd.',
      en: 'Production starts at the plant in Hoshiarpur, Punjab — where the tractors are built from then on.',
    },
    image: {
      src: `${IMG}/1996-hoshiarpur-plant.webp`,
      width: 900,
      height: 749,
      alt: { nl: 'De poort van International Tractors Ltd. in Hoshiarpur', en: 'The gate of International Tractors Ltd. in Hoshiarpur' },
      kind: 'photo',
    },
  },
  {
    year: 2000,
    thread: 'partners',
    title: { nl: 'Kennis uit Europa', en: 'Know-how from Europe' },
    text: {
      nl: 'Joint ventures met Renault Agriculture (Frankrijk) en Claas (Duitsland) brengen geavanceerde technologie in de productontwikkeling.',
      en: 'Joint ventures with Renault Agriculture (France) and Claas (Germany) bring advanced technology into product development.',
    },
  },
  {
    year: 2001,
    thread: 'factory',
    title: { nl: 'Eigen motoren', en: 'Its own engines' },
    text: {
      nl: 'ITL gaat zelf tractormotoren maken — een mijlpaal op weg naar een eigen productiecentrum voor tractoren.',
      en: 'ITL starts making its own tractor engines — a milestone on the way to becoming a tractor manufacturing hub.',
    },
    image: {
      src: `${IMG}/2001-engines.webp`,
      width: 900,
      height: 669,
      alt: { nl: 'Motorproductie bij ITL', en: 'Engine production at ITL' },
      kind: 'photo',
    },
  },
  {
    year: 2005,
    thread: 'partners',
    title: { nl: 'Yanmar, en de eerste compacte', en: 'Yanmar, and the first compact' },
    text: {
      nl: 'Het Japanse Yanmar neemt een belang van 12% in ITL. Daarna volgt de eerste compacttractor: de markt vroeg om kleine maar efficiënte machines.',
      en: "Japan's Yanmar takes a 12% stake in ITL. The first compact tractor follows, for a market asking for small yet efficient machines.",
    },
  },
  {
    year: 2008,
    thread: 'machines',
    title: { nl: 'De RX-serie', en: 'The RX series' },
    text: {
      nl: 'Meer vermogen, betrouwbaarheid en geavanceerde functies voor heel verschillende soorten landbouw.',
      en: 'More power, reliability and advanced features for very different kinds of farming.',
    },
  },
  {
    year: 2009,
    thread: 'machines',
    title: { nl: 'Worldtrac', en: 'Worldtrac' },
    text: {
      nl: 'De Worldtrac-serie komt op de markt, gebouwd voor zwaar landbouwwerk.',
      en: 'The Worldtrac series arrives, built for heavy farm work.',
    },
    image: {
      src: `${IMG}/2009-solis-90.webp`,
      width: 1000,
      height: 666,
      alt: { nl: 'Een Solis 90 pk-tractor uit 2009', en: 'A 2009 Solis 90 hp tractor' },
      kind: 'photo',
    },
  },
  {
    year: 2011,
    thread: 'machines',
    title: { nl: 'Gardentrac', en: 'Gardentrac' },
    text: {
      nl: 'Gardentrac en de 60 RX MM Super openen nieuwe, gespecialiseerde segmenten.',
      en: 'Gardentrac and the 60 RX MM Super open up new, specialised segments.',
    },
  },
  {
    year: 2012,
    thread: 'world',
    title: { nl: 'Meer dan 50 landen', en: 'More than 50 countries' },
    text: {
      nl: 'De internationale verkoop reikt tot meer dan 50 landen.',
      en: 'International business reaches more than 50 countries.',
    },
  },
  {
    year: 2013,
    thread: 'factory',
    title: { nl: 'Hightech-fabriek en cabine', en: 'High-tech plant, and the cab' },
    text: {
      nl: 'Een nieuwe hightech-fabriek opent en tractoren met airconditioned cabine worden geïntroduceerd.',
      en: 'A new high-tech plant opens and tractors with an air-conditioned cab are introduced.',
    },
    image: {
      src: `${IMG}/2013-plant.webp`,
      width: 900,
      height: 900,
      alt: { nl: 'Productie en assemblage in de fabriek', en: 'Production and assembly in the plant' },
      kind: 'photo',
    },
  },
  {
    year: 2014,
    thread: 'world',
    title: { nl: 'Nummer drie van India', en: "India's number three" },
    text: {
      nl: 'ITL wordt de op twee na grootste tractorbouwer van India, verkoopt in 65 landen en begint aan de YM-serie.',
      en: "ITL becomes India's third-largest tractor maker, sells in 65 countries and starts work on the YM series.",
    },
  },
  {
    year: 2015,
    thread: 'factory',
    title: { nl: 'Weer een nieuwe fabriek', en: 'Another new plant' },
    text: {
      nl: 'Een nieuwe, ultramoderne fabriek wordt geopend, met vooruitstrevende cabinetractoren.',
      en: 'A new state-of-the-art plant opens, with progressive air-conditioned cab tractors.',
    },
  },
  {
    year: 2016,
    thread: 'factory',
    title: { nl: '300.000 per jaar', en: '300,000 a year' },
    text: {
      nl: 'Een nieuwe fabriek met een capaciteit van 300.000 tractoren per jaar. De samenwerking met Yanmar wordt uitgebreid naar nieuwe producten.',
      en: 'A new plant built for 300,000 tractors a year, and the Yanmar partnership extended to new products.',
    },
    image: {
      src: `${IMG}/2016-plant.webp`,
      width: 900,
      height: 900,
      alt: { nl: 'De assemblagelijn van de fabriek', en: "The plant's assembly line" },
      kind: 'photo',
    },
  },
  {
    year: 2017,
    thread: 'partners',
    title: { nl: 'Japanse teams in Hoshiarpur', en: 'Japanese teams in Hoshiarpur' },
    text: {
      nl: 'Yanmar neemt nog eens 17,5% van de aandelen en Japanse teams komen naar Hoshiarpur om producten en R&D te verbeteren. De klantenkring groeit tot 750.000.',
      en: 'Yanmar acquires a further 17.5% of ITL and Japanese teams arrive in Hoshiarpur to improve products and R&D. The customer base grows to 750,000.',
    },
  },
  {
    year: 2018,
    thread: 'world',
    title: { nl: '100.000 in één boekjaar', en: '100,000 in one year' },
    text: {
      nl: '100.000 tractoren verkocht in boekjaar 2018-19, assemblagefabrieken in Turkije en Brazilië, en de YM-serie op de markt na uitgebreid R&D-werk.',
      en: '100,000 tractors sold in fiscal 2018-19, assembly plants in Turkey and Brazil, and the YM series launched after extensive R&D.',
    },
  },
  {
    year: 2019,
    thread: 'world',
    title: { nl: 'Meer dan 120 landen', en: 'More than 120 countries' },
    text: {
      nl: 'Actief in meer dan 120 landen, met een assemblagefabriek in de Verenigde Staten.',
      en: 'Active in more than 120 countries, with an assembly plant in the United States.',
    },
  },
  {
    year: 2021,
    thread: 'world',
    home: true,
    title: { nl: 'Ook in Nederland', en: 'The Netherlands, too' },
    text: {
      nl: 'De grootste tractorexporteur van India, aanwezig in meer dan 135 landen — en een nieuwe vestiging in Nederland.',
      en: "India's largest tractor exporter, present in more than 135 countries — and a new branch in the Netherlands.",
    },
  },
  {
    year: 2022,
    thread: 'machines',
    title: { nl: 'Stage V', en: 'Stage V' },
    text: {
      nl: 'Stage V-tractoren worden geïntroduceerd, de YM-serie krijgt nieuwe modellen en de export haalt een record van 35.000 tractoren.',
      en: 'Stage V tractors are introduced, the YM series gets new models, and exports reach a record 35,000 tractors.',
    },
  },
  {
    year: 2024,
    thread: 'partners',
    title: { nl: 'Thaler en Burder', en: 'Thaler and Burder' },
    text: {
      nl: 'ITL groeit met overnames, waaronder Thaler, en een joint venture met Burder (AgAttachments) voor landbouwinnovatie.',
      en: 'ITL grows through acquisitions, including Thaler, and a joint venture with Burder (AgAttachments) to drive farm innovation.',
    },
  },
  {
    year: 2025,
    thread: 'world',
    title: { nl: 'Rome, de VS en een exportfabriek', en: 'Rome, the USA and an export plant' },
    text: {
      nl: 'Kantoren in Rome en de Verenigde Staten worden geopend, en in Hoshiarpur komt een nieuwe exportfabriek.',
      en: 'Offices open in Rome and the United States, and a new export plant in Hoshiarpur.',
    },
  },
]

/** Chapters of the timeline, for the rail under it. */
export const ERAS: { from: number; to: number; title: Localized }[] = [
  { from: 1969, to: 1996, title: { nl: 'De werkplaats', en: 'The workshop' } },
  { from: 2000, to: 2005, title: { nl: 'Kennis binnenhalen', en: 'Bringing in know-how' } },
  { from: 2008, to: 2013, title: { nl: 'Een volledige lijn', en: 'A full line-up' } },
  { from: 2014, to: 2018, title: { nl: 'Schaal', en: 'Scale' } },
  { from: 2019, to: 2025, title: { nl: 'De wereld in', en: 'Out into the world' } },
]

export const FIRST_MACHINES: { year: number; label: Localized; image: HistoryImage }[] = [
  {
    year: 1969,
    label: { nl: 'Eerst dit', en: 'First, this' },
    image: {
      src: `${IMG}/1969-thresher.webp`,
      width: 900,
      height: 900,
      alt: { nl: 'Een Sonalika-dorsmachine', en: 'A Sonalika thresher' },
      kind: 'cutout',
    },
  },
  {
    year: 1995,
    label: { nl: 'Daarna dit', en: 'Then, this' },
    image: {
      src: `${IMG}/1995-first-tractor.webp`,
      width: 1100,
      height: 733,
      alt: { nl: 'De eerste Sonalika-tractor', en: 'The first Sonalika tractor' },
      kind: 'cutout',
    },
  },
]

/** ITL today, as solisworld.com/about-solis states it. */
export const TODAY: { value: number; suffix?: string; label: Localized }[] = [
  { value: 300000, label: { nl: 'tractoren per jaar', en: 'tractors a year' } },
  { value: 150, suffix: '+', label: { nl: 'landen', en: 'countries' } },
  { value: 6000, suffix: '+', label: { nl: 'vakmensen in de fabriek', en: 'skilled people in the plant' } },
  { value: 200000, suffix: ' m²', label: { nl: 'fabrieksterrein', en: 'of plant floor' } },
  { value: 1800, label: { nl: 'distributeurs wereldwijd', en: 'distributors worldwide' } },
]

export const SOURCES: { label: string; href: string }[] = [
  { label: 'Solis — Our history', href: 'https://solisworld.com/our-history/' },
  { label: 'Solis — About Solis', href: 'https://solisworld.com/about-solis/' },
  { label: 'Sonalika — About us', href: 'https://www.sonalika.com/about-us.html' },
  { label: 'Forbes — Lachhman Das Mittal', href: 'https://www.forbes.com/profile/lachhman-das-mittal/' },
]

/** The page's own words, in both languages. */
export const HISTORY_COPY = {
  meta: {
    title: { nl: 'Onze geschiedenis | Solis Tractoren', en: 'Our history | Solis Tractors' },
    description: {
      nl: 'Van landbouwwerktuigen in 1969 tot Stage V-tractoren: de oprichter L.D. Mittal, de eerste machines en elke innovatie van ITL, de maker van Solis.',
      en: 'From farm implements in 1969 to Stage V tractors: founder L.D. Mittal, the first machines and every innovation at ITL, the maker of Solis.',
    },
  },
  crumb: { nl: 'Geschiedenis', en: 'History' },
  hero: {
    eyebrow: { nl: 'Onze geschiedenis', en: 'Our history' },
    title: { nl: ['Gouden lijnen,', 'sinds 1969.'], en: ['Lines of gold,', 'since 1969.'] } as Localized<readonly string[]>,
    lead: {
      nl: 'Hoe een maker van landbouwwerktuigen uit Hoshiarpur, Punjab, uitgroeide tot de bouwer van Solis: de oprichter, de eerste machines en elke vernieuwing daarna — van dorsmachine tot Stage V.',
      en: 'How a maker of farm implements from Hoshiarpur, Punjab, grew into the builder of Solis: the founder, the first machines and every innovation since — from thresher to Stage V.',
    },
    cue: { nl: '56 jaar, in één keer doorscrollen', en: '56 years, in one scroll' },
  },
  founder: {
    eyebrow: { nl: 'De oprichter', en: 'The founder' },
    name: 'L.D. Mittal',
    role: { nl: 'Oprichter en voorzitter, ITL Group', en: 'Founder & Chairman, ITL Group' },
    nickname: { nl: 'Bekend als ‘The Tractor Titan’', en: 'Known as ‘The Tractor Titan’' },
    lead: {
      nl: 'Zijn drijfveer, in de woorden van het bedrijf zelf: boeren technologisch betere producten geven. Eerst met werktuigen — en daarna, om de boer de complete oplossing te bieden, met tractoren.',
      en: "His drive, in the company's own words: giving farmers technologically better products. First with implements — then, to offer the complete farming solution, with tractors.",
    },
    facts: [
      {
        nl: 'Gouden medaille aan Punjab University, met masters in Engels en Urdu.',
        en: 'Gold medallist at Punjab University, with master’s degrees in English and Urdu.',
      },
      {
        nl: 'Een loopbaan bij LIC, de Indiase staatsverzekeraar — daarna wijdde hij zich helemaal aan de landbouw.',
        en: 'A career at LIC, India’s state insurer — after which he gave himself fully to farming.',
      },
      {
        nl: 'Richtte in 1969 ITL Group op voor landbouwwerktuigen; in 1995 volgde de eerste tractor.',
        en: 'Founded ITL Group in 1969 to make farm implements; the first tractor followed in 1995.',
      },
      {
        nl: 'Ernst & Young Entrepreneur of the Year, 2006.',
        en: 'Ernst & Young Entrepreneur of the Year, 2006.',
      },
      {
        nl: 'Was voorzitter van de Indiase vereniging van tractorfabrikanten.',
        en: 'Served as President of the Indian Tractor Manufacturers Association.',
      },
    ],
    portraitAlt: { nl: 'L.D. Mittal, oprichter en voorzitter van ITL Group', en: 'L.D. Mittal, founder and chairman of ITL Group' },
    nameStory: {
      kicker: { nl: 'Over de naam', en: 'About the name' },
      title: { nl: 'Sonalika betekent ‘gouden lijnen’.', en: 'Sonalika means ‘lines of gold’.' },
      text: {
        nl: 'De naam komt van een tarwezaad dat de Groene Revolutie in India mede op gang bracht. Solis is de naam waaronder ITL zijn tractoren internationaal verkoopt.',
        en: "It is named after a wheat seed that helped fuel India's Green Revolution. Solis is the name under which ITL sells its tractors internationally.",
      },
      source: { nl: 'Bron: Forbes', en: 'Source: Forbes' },
    },
  },
  first: {
    eyebrow: { nl: 'Wat hij als eerste bouwde', en: 'What he built first' },
    title: { nl: 'Het begon niet met een tractor.', en: "It didn't start with a tractor." },
    text: {
      nl: 'Eerst kwamen de werktuigen, zoals de Sonalika-dorsmachine. Ruim een kwarteeuw later, in 1995, werd de eerste tractor geassembleerd.',
      en: 'First came the implements, like the Sonalika thresher. More than a quarter of a century later, in 1995, the first tractor was assembled.',
    },
    gap: { nl: '26 jaar later', en: '26 years later' },
  },
  timeline: {
    eyebrow: { nl: 'Innovatie, jaar na jaar', en: 'Innovation, year by year' },
    title: { nl: 'Elke stap die Solis maakte.', en: 'Every step that made Solis.' },
    filterLabel: { nl: 'Filter op thema', en: 'Filter by theme' },
    count: { nl: (n: number) => `${n} mijlpalen`, en: (n: number) => `${n} milestones` },
    showOnly: { nl: 'Toon alleen', en: 'Show only' },
    showAll: { nl: 'Toon alle thema’s', en: 'Show all themes' },
    erasLabel: { nl: 'Tijdperken: spring naar een periode', en: 'Eras: jump to a period' },
    home: { nl: 'Hier begint Solis in Nederland', en: 'Where Solis in the Netherlands begins' },
  },
  today: {
    eyebrow: { nl: 'ITL vandaag', en: 'ITL today' },
    title: { nl: 'Wat 56 jaar heeft opgebouwd.', en: 'What 56 years have built.' },
    note: { nl: 'Zoals Solis het opgeeft.', en: 'As Solis states it.' },
  },
  home: {
    eyebrow: { nl: '2021 — en nu', en: '2021 — and today' },
    title: { nl: 'En toen: Nederland.', en: 'And then: the Netherlands.' },
    text: {
      nl: 'In 2021 opende Solis een vestiging in Nederland. Vandaag vertegenwoordigt AgriXpert het merk, met een landelijk netwerk van dealers voor advies, demonstratie en service.',
      en: 'In 2021 Solis opened a branch in the Netherlands. Today AgriXpert represents the brand, with a nationwide network of dealers for advice, demonstrations and service.',
    },
    models: { nl: 'Bekijk de modellen', en: 'View the models' },
    dealers: { nl: 'Vind een dealer', en: 'Find a dealer' },
  },
  teaser: {
    eyebrow: { nl: 'Onze geschiedenis', en: 'Our history' },
    title: { nl: 'Van dorsmachine tot Stage V.', en: 'From thresher to Stage V.' },
    text: {
      nl: 'De oprichter, de eerste machines en elke innovatie sinds 1969 — in één verhaal.',
      en: 'The founder, the first machines and every innovation since 1969 — in one story.',
    },
    cta: { nl: 'Lees het verhaal', en: 'Read the story' },
  },
  sources: {
    title: { nl: 'Bronnen', en: 'Sources' },
    note: {
      nl: 'Alle feiten komen uit de geschiedenis die ITL zelf publiceert en uit de genoemde bronnen; foto’s: solisworld.com. Waar bronnen een jaartal anders noemen, volgen we de geschiedenis van Solis.',
      en: 'Every fact comes from the history ITL publishes itself and from the sources listed; photographs: solisworld.com. Where sources give a different year, we follow the Solis history.',
    },
  },
} as const
