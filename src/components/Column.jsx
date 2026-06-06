import { useState } from 'react'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import Card from './Card.jsx'
import { actions } from '../yjs/store.js'
import { useI18n } from '../i18n.jsx'

/** A column: a sortable container that also hosts a sortable list of cards. */
export default function Column({ column, cards, onOpenCard, activeCardId }) {
  const { t } = useI18n()
  const [adding, setAdding] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(column.title)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: 'column', columnId: column.id },
  })

  // A droppable for the whole column body so cards can be dropped into an
  // empty column or below the last card.
  const { setNodeRef: setDropRef } = useDroppable({
    id: `col-drop-${column.id}`,
    data: { type: 'column', columnId: column.id },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const commitAdd = () => {
    actions.addCard(column.id, draftTitle)
    setDraftTitle('')
    // keep composer open for rapid entry
  }

  const commitRename = () => {
    const t = titleDraft.trim()
    if (t && t !== column.title) actions.renameColumn(column.id, t)
    else setTitleDraft(column.title)
    setEditingTitle(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="surface flex h-full w-80 shrink-0 flex-col rounded-2xl shadow-[0_24px_50px_-30px_rgba(0,0,0,0.9)]"
    >
      {/* Header: drag handle + title + count + delete */}
      <div className="group/header flex items-center gap-2 px-4 pb-2.5 pt-3.5">
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab select-none text-base leading-none text-faint opacity-0 transition hover:text-sand group-hover/header:opacity-100 active:cursor-grabbing"
          title={t('dragColumn')}
        >
          ⠿
        </span>

        {editingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') {
                setTitleDraft(column.title)
                setEditingTitle(false)
              }
            }}
            className="field flex-1 rounded-lg px-2.5 py-1 font-display text-base font-semibold"
          />
        ) : (
          <h2
            onClick={() => {
              setTitleDraft(column.title)
              setEditingTitle(true)
            }}
            className="flex-1 cursor-text truncate font-display text-base font-semibold tracking-tight text-cream"
            title={column.title}
          >
            {column.title}
          </h2>
        )}

        <span className="grid h-6 min-w-6 place-items-center rounded-full bg-ink-700/70 px-2 font-mono text-xs text-sand">
          {cards.length}
        </span>
        <button
          onClick={() => {
            if (confirm(t('deleteColumnConfirm', column.title))) {
              actions.deleteColumn(column.id)
            }
          }}
          className="rounded-md p-1 text-faint opacity-0 transition hover:bg-overdue/10 hover:text-overdue group-hover/header:opacity-100"
          title={t('deleteColumn')}
        >
          ✕
        </button>
      </div>

      {/* Hairline divider */}
      <div className="mx-4 h-px bg-cream/8" />

      {/* Cards */}
      <div
        ref={setDropRef}
        className="board-scroll flex min-h-3 flex-1 flex-col gap-2.5 overflow-y-auto px-3 py-3"
      >
        <SortableContext
          items={column.cardIds}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((card) => (
            <Card
              key={card.id}
              card={card}
              onOpen={onOpenCard}
              dragging={card.id === activeCardId}
            />
          ))}
        </SortableContext>

        {cards.length === 0 && !adding && (
          <div className="mt-1 rounded-xl border border-dashed border-cream/8 px-3 py-6 text-center text-xs text-faint">
            ✦ {t('emptyColumn')}
          </div>
        )}
      </div>

      {/* Add card */}
      <div className="p-2.5">
        {adding ? (
          <div className="paper rounded-xl p-2.5">
            <textarea
              autoFocus
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  commitAdd()
                }
                if (e.key === 'Escape') {
                  setAdding(false)
                  setDraftTitle('')
                }
              }}
              rows={2}
              placeholder={t('cardTitlePlaceholder')}
              className="w-full resize-none bg-transparent text-sm leading-snug text-cream outline-none placeholder:text-faint"
            />
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={commitAdd}
                className="btn-accent rounded-lg px-3 py-1.5 text-xs font-semibold"
              >
                {t('add')}
              </button>
              <button
                onClick={() => {
                  setAdding(false)
                  setDraftTitle('')
                }}
                className="rounded-lg px-2.5 py-1.5 text-xs text-sand transition hover:text-cream"
              >
                {t('done')}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-start text-sm font-medium text-faint transition hover:bg-cream/5 hover:text-cream"
          >
            <span className="text-base leading-none text-accent">＋</span>
            {t('addCard')}
          </button>
        )}
      </div>
    </div>
  )
}
