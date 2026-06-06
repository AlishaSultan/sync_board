import { useEffect, useRef, useState } from 'react'
import { actions } from '../yjs/store.js'
import { LABELS } from '../labels.js'
import { useI18n } from '../i18n.jsx'

/** Modal for editing a card's title, description, labels and due date. */
export default function CardEditor({ card, onClose }) {
  const { t, lang } = useI18n()
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description)
  const [labels, setLabels] = useState(card.labels || [])
  const [dueDate, setDueDate] = useState(card.dueDate || '')
  const titleRef = useRef(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  const save = () => {
    const trimmed = title.trim()
    if (!trimmed) return
    actions.editCard(card.id, { title: trimmed, description, labels, dueDate })
    onClose()
  }

  const remove = () => {
    actions.deleteCard(card.id)
    onClose()
  }

  const toggleLabel = (id) =>
    setLabels((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="pop-in surface w-full max-w-lg rounded-2xl p-6 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.95)]"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="eyebrow">{t('title')}</span>
        <input
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save()
            if (e.key === 'Escape') onClose()
          }}
          className="field mt-1.5 w-full rounded-lg px-3 py-2.5 font-display text-lg font-semibold"
        />

        <p className="eyebrow mt-5">{t('labels')}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {LABELS.map((l) => {
            const on = labels.includes(l.id)
            return (
              <button
                key={l.id}
                onClick={() => toggleLabel(l.id)}
                style={{
                  backgroundColor: on ? l.color : `${l.color}1a`,
                  borderColor: on ? l.color : `${l.color}55`,
                  color: on ? '#1b1610' : l.color,
                }}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: on ? '#1b1610' : l.color }}
                />
                {l[lang] || l.en}
              </button>
            )
          })}
        </div>

        <p className="eyebrow mt-5">{t('dueDate')}</p>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="field scheme-dark rounded-lg px-3 py-2 text-sm"
          />
          {dueDate ? (
            <button
              onClick={() => setDueDate('')}
              className="rounded-lg px-2.5 py-1.5 text-xs text-sand transition hover:text-cream"
            >
              {t('clear')}
            </button>
          ) : null}
        </div>

        <p className="eyebrow mt-5">{t('description')}</p>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="field mt-2 w-full resize-y rounded-lg px-3 py-2.5 text-sm leading-relaxed"
          placeholder={t('descriptionPlaceholder')}
        />

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={remove}
            className="rounded-lg px-3 py-2 text-sm font-medium text-overdue transition hover:bg-overdue/10"
          >
            {t('delete')}
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-sand transition hover:bg-cream/5 hover:text-cream"
            >
              {t('cancel')}
            </button>
            <button
              onClick={save}
              className="btn-accent rounded-lg px-5 py-2 text-sm font-semibold"
            >
              {t('save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
