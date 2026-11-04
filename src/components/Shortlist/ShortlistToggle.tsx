import { useLanguage } from '../../i18n/LanguageContext'
import { models } from '../../data/models'
import { toggleShortlist, usePersonal } from '../../personal/personal'
import { Heart } from '../Icons'
import './shortlist.css'

/**
 * The ♥ that puts a model on the reader's shortlist. `labelled` shows the
 * word next to the heart (the gallery's buy column); otherwise it is an icon
 * button with a full accessible name and its pressed state.
 */
export function ShortlistToggle({ modelId, labelled = false }: { modelId: string; labelled?: boolean }) {
  const { t } = useLanguage()
  const { shortlist } = usePersonal()
  const on = shortlist.includes(modelId)
  const name = models.find((m) => m.id === modelId)?.fullName ?? modelId
  const label = on ? t.shortlist.remove(name) : t.shortlist.add(name)

  return (
    <button
      type="button"
      className="heart-btn"
      data-labelled={labelled ? 'true' : 'false'}
      aria-pressed={on}
      aria-label={labelled ? undefined : label}
      title={label}
      onClick={(e) => {
        e.stopPropagation()
        toggleShortlist(modelId)
      }}
    >
      <Heart className="heart-btn__icon" />
      {labelled && (
        <span>
          {on ? t.shortlist.saved : t.shortlist.save}
          {/* the visible word keeps its object for screen readers: "Bewaar S50 Shuttle XL" */}
          <span className="visually-hidden"> {name}</span>
        </span>
      )}
    </button>
  )
}
