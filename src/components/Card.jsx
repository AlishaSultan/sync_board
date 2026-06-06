import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { LABELS_BY_ID } from '../labels.js'
import { useI18n } from '../i18n.jsx'

function formatDue(dueDate) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate + 'T00:00:00')
  const overdue = due < today
  const label = due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return { label, overdue }
}

/**
 * A single draggable card. Visual-only during drag (dnd-kit); the final order
 * is committed to Yjs on drag end by the Board.
 */
export default function Card({ card, onOpen, dragging }) {
  const { t, lang } = useI18n()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { type: 'card', cardId: card.id },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  // The card's spine takes the colour of its first label; unlabeled cards get a
  // faint sand spine that warms to amber on hover.
  const firstLabel = card.labels?.map((id) => LABELS_BY_ID[id]).find(Boolean)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen?.(card.id)}
      className={`paper group relative cursor-grab overflow-hidden rounded-xl ps-4 pe-3 py-3 text-sm text-cream transition-[transform,box-shadow,border-color] duration-150 active:cursor-grabbing ${
        dragging ? 'border-accent! shadow-2xl ring-1 ring-accent/40' : ''
      }`}
    >
      {/* Colored spine — first label's hue; unlabeled cards get a faint sand
          spine at rest that warms to amber on hover. */}
      {firstLabel ? (
        <span
          aria-hidden
          className="absolute inset-y-0 start-0 w-1.5"
          style={{ backgroundColor: firstLabel.color, opacity: 0.9 }}
        />
      ) : (
        <span
          aria-hidden
          className="absolute inset-y-0 start-0 w-1.5 bg-faint opacity-40 transition-colors duration-200 group-hover:bg-accent group-hover:opacity-90"
        />
      )}

      {card.labels?.length ? (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {card.labels.map((id) => {
            const l = LABELS_BY_ID[id]
            if (!l) return null
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide"
                style={{ backgroundColor: `${l.color}22`, color: l.color }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: l.color }} />
                {l[lang] || l.en}
              </span>
            )
          })}
        </div>
      ) : null}

      <p className="font-medium leading-snug break-words">{card.title}</p>
      {card.description ? (
        <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-sand break-words">
          {card.description}
        </p>
      ) : null}

      {card.dueDate ? (
        (() => {
          const { label, overdue } = formatDue(card.dueDate)
          return (
            <div
              className={`mt-2.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                overdue
                  ? 'bg-overdue/15 text-overdue'
                  : 'bg-ink-700/70 text-sand'
              }`}
              title={overdue ? t('overdue') : ''}
            >
              <span aria-hidden>{overdue ? '⚠' : '🗓'}</span> {label}
            </div>
          )
        })()
      ) : null}
    </div>
  )
}
