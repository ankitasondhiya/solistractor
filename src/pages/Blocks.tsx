import { createContext, useContext, type ReactNode } from 'react'

import { useLanguage } from '../i18n/LanguageContext'
import type { PageBlock, PageCard, PageItem, PageLink, PageOffer } from '../data/pages'
import { ArrowRight, ArrowUpRight, Check, Mail, Phone, Pin } from '../components/Icons'
import { Reveal } from '../components/Reveal'
import { ContactForm } from './ContactForm'
import { WarrantyForm } from './WarrantyForm'

/**
 * Draws a page from solistractor.nl in this site's own design. The content is
 * theirs, as published; the layout follows from its shape — a hero, sections
 * of heading + text with an image, grids of cards (numbered steps, figures,
 * timelines, spec tables), contact cards, a map, a form or a legal text.
 */
/** Links a page takes over, by href: a dealer's "Plan een bezoek" becomes a demo request with that dealer. */
const Handlers = createContext<Record<string, () => void>>({})

export function Blocks({
  blocks,
  crumbs,
  extra,
  handlers = {},
}: {
  blocks: PageBlock[]
  crumbs?: ReactNode
  extra?: ReactNode
  handlers?: Record<string, () => void>
}) {
  return (
    <Handlers.Provider value={handlers}>
      {blocks.map((block, i) =>
        block.kind === 'hero' ? (
          <Hero key={i} block={block} crumbs={crumbs} />
        ) : (
          <Section key={i} block={block} />
        ),
      )}
      {extra}
    </Handlers.Provider>
  )
}

/* Hero ------------------------------------------------------------------------- */
function Hero({ block, crumbs }: { block: PageBlock; crumbs?: ReactNode }) {
  return (
    <section className="cp-hero" data-dark-hero="" data-photo={block.image ? 'true' : 'false'}>
      {block.image && <img className="cp-hero__photo" src={block.image.src} alt=""  decoding="async" />}
      <div className="container cp-hero__inner">
        {crumbs}
        {block.eyebrow && <p className="eyebrow eyebrow--light">{block.eyebrow}</p>}
        {block.title && (
          <h1 className="display cp-hero__title" tabIndex={-1} data-page-title="">
            {block.title}
          </h1>
        )}
        {block.badge && (
          <p className="cp-badge">
            <Check aria-hidden="true" />
            {block.badge}
          </p>
        )}
        {block.text?.map((t) => (
          <p key={t} className="cp-hero__lead">
            {t}
          </p>
        ))}
        {block.actions && <Actions links={block.actions} dark />}
      </div>
    </section>
  )
}

/* Section ---------------------------------------------------------------------- */
function Section({ block }: { block: PageBlock }) {
  const dark = block.tone === 'dark'
  const items = block.items ?? []
  const grouped = block.groups && block.groups.length > 0
  const split = !!block.image && items.length === 0 && !block.form && !block.flow
  const hasHead = block.eyebrow || block.title || block.text || block.lists

  return (
    <section
      className="cp-section"
      id={block.id}
      data-tone={block.tone}
      data-split={split ? 'true' : 'false'}
      data-variant={block.variant.join(' ')}
    >
      <div className="container">
        {block.offer ? (
          <Offer offer={block.offer} />
        ) : block.flow ? (
          <LegalText flow={block.flow} actions={block.actions} />
        ) : (
          <>
            <div className="cp-section__top">
              {hasHead && (
                <Reveal className="cp-head">
                  {block.eyebrow && <p className={dark ? 'eyebrow eyebrow--light' : 'eyebrow'}>{block.eyebrow}</p>}
                  {block.title && <h2 className="display display--md">{block.title}</h2>}
                  {block.text?.map((t) => (
                    <p key={t} className="cp-text">
                      {t}
                    </p>
                  ))}
                  {block.lists?.map((list, i) => (
                    <ul key={i} className="cp-list">
                      {list.map((li) => (
                        <li key={li}>
                          <Check aria-hidden="true" />
                          {li}
                        </li>
                      ))}
                    </ul>
                  ))}
                  {block.note && <Note note={block.note} without={block.actions?.map((a) => a.label)} />}
                  {block.actions && <Actions links={block.actions} dark={dark} />}
                </Reveal>
              )}
              {split && block.image && (
                <Reveal className="cp-figure">
                  <img src={block.image.src} alt={block.image.alt} loading="lazy" decoding="async" />
                </Reveal>
              )}
              {block.cards && !block.form && (
                <div className="cp-cards">
                  {block.cards.map((card, i) => (
                    <ContactCard key={i} card={card} dark={dark} />
                  ))}
                </div>
              )}
            </div>

            {block.map && <MapFigure map={block.map} />}

            {grouped
              ? block.groups!.map((g, gi) => (
                  <div key={g.title} className="cp-group">
                    <div className="cp-group__head">
                      {g.kicker && <p className={dark ? 'eyebrow eyebrow--light' : 'eyebrow'}>{g.kicker}</p>}
                      <h3 className="cp-group__title">{g.title}</h3>
                      {g.text?.map((t) => (
                        <p key={t} className="cp-text">
                          {t}
                        </p>
                      ))}
                    </div>
                    <Items items={items.filter((it) => it.group === gi)} layout={block.layout} dark={dark} level={4} />
                  </div>
                ))
              : items.length > 0 && <Items items={items} layout={block.layout} dark={dark} level={block.title ? 3 : 2} />}

            {block.form && (
              <div className="cp-form-wrap">
                <div className="cp-form">
                  {block.form === 'contact' ? <ContactForm subjects={block.formOptions ?? []} /> : <WarrantyForm />}
                </div>
                {block.cards && (
                  <div className="cp-cards cp-cards--aside">
                    {block.cards.map((card, i) => (
                      <ContactCard key={i} card={card} dark={false} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

/* Promotion -------------------------------------------------------------------- */
/**
 * A promotion as the price list sets it: the machine with its attachment and
 * the saving on one side; on the other the pitch, its points, and every line
 * with its list price struck through beside the promotion price, then the
 * totals. The period and the small print stay with the prices they qualify.
 */
function Offer({ offer }: { offer: PageOffer }) {
  const [machine, attachment] = offer.images ?? []
  const head = offer.table?.head ?? []
  return (
    <div className="cp-offer">
      <Reveal className="cp-offer__visual">
        {machine && (
          <figure className="cp-offer__machine">
            <img src={machine.src} alt={machine.alt} loading="lazy" decoding="async" />
          </figure>
        )}
        {attachment && (
          <figure className="cp-offer__attachment">
            <img src={attachment.src} alt={attachment.alt} loading="lazy" decoding="async" />
            <figcaption>{attachment.alt}</figcaption>
          </figure>
        )}
        {offer.saving && (
          <p className="cp-offer__saving">
            <span>{offer.saving.label}</span>
            <strong>{offer.saving.value}</strong>
          </p>
        )}
      </Reveal>

      <Reveal className="cp-offer__body" delay={80}>
        {offer.eyebrow && <p className="eyebrow">{offer.eyebrow}</p>}
        {offer.title && <h2 className="display display--md">{offer.title}</h2>}
        {offer.text && <p className="cp-text">{offer.text}</p>}
        {offer.points && (
          <ul className="cp-list">
            {offer.points.map((p) => (
              <li key={p}>
                <Check aria-hidden="true" />
                {p}
              </li>
            ))}
          </ul>
        )}

        {offer.table && (
          <div className="cp-offer__table-wrap">
            <table className="cp-offer__table">
              <thead>
                <tr>
                  {head.map((h, i) => (
                    <th key={h} scope="col" data-num={i > 0 ? 'true' : undefined}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {offer.table.rows.map((row) => (
                  <tr key={row.item} data-total={row.total ? 'true' : undefined}>
                    <th scope="row">
                      {row.item}
                      {row.note && <small>{row.note}</small>}
                    </th>
                    <td data-num="true" className="cp-offer__was">
                      {row.was ? <s>{row.was}</s> : <span className="cp-offer__none">—</span>}
                    </td>
                    <td data-num="true" className="cp-offer__now">
                      <strong>{row.now}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {offer.period && <Note note={offer.period} />}
        {offer.actions && <Actions links={offer.actions} dark={false} />}
        {offer.footnote && <p className="cp-offer__footnote">{offer.footnote}</p>}
      </Reveal>
    </div>
  )
}

/* Cards ------------------------------------------------------------------------ */
const TIMELINE = ['history-list', 'warranty-timeline']

function shapeOf(item: PageItem, all: PageItem[]): 'stat' | 'image' | 'spec' | 'step' | 'plain' {
  if (item.rows) return 'spec'
  if (item.image) return 'image'
  // Big figures for figures ("150+", "16–125 pk"); a row of words stays text.
  if (item.label && !item.text) return all.some((x) => /\d/.test(x.title ?? '')) ? 'stat' : 'plain'
  if (item.marker) return 'step'
  return 'plain'
}

function Items({ items, layout = [], dark, level }: { items: PageItem[]; layout?: string[]; dark: boolean; level: 2 | 3 | 4 }) {
  const Heading = `h${level}` as 'h2' | 'h3' | 'h4'
  const timeline = layout.some((l) => TIMELINE.includes(l))
  const shape = items[0] ? shapeOf(items[0], items) : 'plain'
  return (
    <ol className="cp-items" data-shape={shape} data-timeline={timeline ? 'true' : 'false'} data-count={items.length}>
      {items.map((item, i) => (
        <li
          key={`${item.title ?? ''}-${i}`}
          className="cp-item"
          data-featured={item.featured ? 'true' : 'false'}
          style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
        >
          {item.image && (
            <div className="cp-item__pic">
              <img src={item.image.src} alt={item.image.alt} loading="lazy" decoding="async" />
              {item.marker && shape === 'image' && <span className="cp-item__tag">{item.marker}</span>}
            </div>
          )}
          {item.marker && shape !== 'image' && <span className="cp-item__marker">{item.marker}</span>}
          <div className="cp-item__body">
            {item.kicker && <p className="cp-item__kicker">{item.kicker}</p>}
            {item.title &&
              (shape === 'stat' ? (
                <p className="cp-item__figure">{item.title}</p>
              ) : (
                <Heading className="cp-item__title">{item.title}</Heading>
              ))}
            {item.label && <p className="cp-item__label">{item.label}</p>}
            {item.text?.map((t) => (
              <p key={t} className="cp-item__text">
                {t}
              </p>
            ))}
            {item.rows && (
              <dl className="cp-item__rows">
                {item.rows.map((r) => (
                  <div key={`${r.term}-${r.value}`}>
                    <dt>{r.term}</dt>
                    <dd>{r.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {item.note?.map((n) => (
              <p key={n} className="cp-item__note">
                {n}
              </p>
            ))}
            {item.links && <Actions links={item.links} dark={dark || !!item.featured} small />}
          </div>
        </li>
      ))}
    </ol>
  )
}

function ContactCard({ card, dark }: { card: PageCard; dark: boolean }) {
  return (
    <div className="cp-contact" data-dark={dark ? 'true' : 'false'}>
      {card.eyebrow && <p className={dark ? 'eyebrow eyebrow--light' : 'eyebrow'}>{card.eyebrow}</p>}
      {card.title && <h3 className="cp-contact__title">{card.title}</h3>}
      {card.lines?.map((l) => (
        <p key={l} className="cp-contact__line">
          {l}
        </p>
      ))}
      {card.links && (
        <ul className="cp-contact__links">
          {card.links.map((l) => (
            <li key={`${l.href}-${l.label}`}>
              <SmartLink link={l} withIcon />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function MapFigure({ map }: { map: NonNullable<PageBlock['map']> }) {
  const { t } = useLanguage()
  return (
    <figure className="cp-map">
      <div className="cp-map__frame">
        <img src={map.src} alt={map.alt} loading="lazy" decoding="async" />
        <span className="cp-map__pin" aria-hidden="true" />
      </div>
      <figcaption>
        {map.credit && map.creditHref ? (
          <a href={map.creditHref} target="_blank" rel="noopener noreferrer">
            {map.credit}
            <span className="visually-hidden"> {t.pages.external}</span>
          </a>
        ) : (
          map.credit
        )}
      </figcaption>
    </figure>
  )
}

function Note({ note, without = [] }: { note: { title: string; text: string }; without?: string[] }) {
  // The link inside the original note is drawn as a button below it instead.
  const text = without.reduce((acc, label) => acc.replace(new RegExp(`\\s*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*→?\\s*\\.?$`), '.'), note.text)
  return (
    <div className="cp-note" role="note">
      <strong>{note.title}</strong>
      <p>{text.replace(/\.\.$/, '.')}</p>
    </div>
  )
}

function LegalText({ flow, actions }: { flow: NonNullable<PageBlock['flow']>; actions?: PageLink[] }) {
  return (
    <article className="cp-legal">
      {flow.map((n, i) => {
        if (n.tag === 'h2') return <h2 key={i}>{n.text}</h2>
        if (n.tag === 'h3') return <h3 key={i}>{n.text}</h3>
        if (n.tag === 'li')
          return (
            <p key={i} className="cp-legal__li">
              {n.text}
            </p>
          )
        return <p key={i}>{n.text}</p>
      })}
      {actions && <Actions links={actions} dark={false} />}
    </article>
  )
}

/* Links ------------------------------------------------------------------------- */
function Actions({ links, dark, small = false }: { links: PageLink[]; dark: boolean; small?: boolean }) {
  return (
    <div className="cp-actions" data-small={small ? 'true' : 'false'}>
      {links.map((l) => (
        <SmartLink key={`${l.href}-${l.label}`} link={l} dark={dark} small={small} />
      ))}
    </div>
  )
}

/**
 * One link from the content, drawn by what it does: a page or section of this
 * site (handled by the router), a phone number, an email, a PDF (opens in a
 * new tab, marked "PDF"), or — rarely — another site such as a dealer's own
 * or a map, which opens in a new tab so this site stays where it was.
 */
export function SmartLink({
  link,
  dark = false,
  small = false,
  withIcon = false,
}: {
  link: PageLink
  dark?: boolean
  small?: boolean
  withIcon?: boolean
}) {
  const { t } = useLanguage()
  const handlers = useContext(Handlers)
  const handler = handlers[link.href]
  const external = link.kind === 'external'
  const file = link.kind === 'file'
  const newTab = external || file
  const style = link.style ?? (withIcon ? 'plain' : 'text')
  const className =
    style === 'primary'
      ? `btn${small ? ' btn--sm' : ''}`
      : style === 'secondary'
        ? `btn ${dark ? 'btn--ghost-light' : 'btn--ghost'}${small ? ' btn--sm' : ''}`
        : style === 'plain'
          ? 'cp-link'
          : 'text-link'
  const Icon =
    link.kind === 'tel' ? Phone : link.kind === 'mail' ? Mail : external && /maps/.test(link.href) ? Pin : external ? ArrowUpRight : ArrowRight
  return (
    <a
      className={className}
      href={link.href}
      {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      data-kind={link.kind}
      onClick={
        handler
          ? (e) => {
              e.preventDefault()
              handler()
            }
          : undefined
      }
    >
      {withIcon && <Icon className="cp-link__icon" aria-hidden="true" />}
      <span>{link.label}</span>
      {file && <span className="cp-pdf">{t.pages.pdf}</span>}
      {!withIcon && style !== 'plain' && (external ? <ArrowUpRight className="btn__icon" /> : <ArrowRight className="btn__icon" />)}
      {newTab && <span className="visually-hidden"> {t.pages.external}</span>}
    </a>
  )
}
