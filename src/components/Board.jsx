import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import Column from './Column.jsx'
import Card from './Card.jsx'
import CardEditor from './CardEditor.jsx'
import { useBoard } from '../yjs/hooks.js'
import { actions } from '../yjs/store.js'
import { useI18n } from '../i18n.jsx'

export default function Board() {
  const { t } = useI18n()
  const board = useBoard()
  const cards = board.cards

  // During a drag we render from a local working copy so reordering is smooth
  // and is committed to Yjs only once, on drag end.
  const [override, setOverride] = useState(null)
  const columns = override ?? board.columns

  const [active, setActive] = useState(null) // { id, type }
  const [editingCardId, setEditingCardId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const colIds = columns.map((c) => c.id)
  const colOf = (cols, cardId) => cols.findIndex((c) => c.cardIds.includes(cardId))

  function workingCopy(cols) {
    return cols.map((c) => ({ ...c, cardIds: [...c.cardIds] }))
  }

  function onDragStart({ active }) {
    setActive({ id: active.id, type: active.data.current?.type })
    setOverride(workingCopy(board.columns))
  }

  // Cross-column card movement happens live here for visual feedback.
  function onDragOver({ active, over }) {
    if (!over || active.data.current?.type !== 'card') return
    const cardId = active.id

    setOverride((prev) => {
      const cols = workingCopy(prev || board.columns)
      const fromIdx = colOf(cols, cardId)
      if (fromIdx === -1) return prev

      let toIdx
      let insertAt
      const overType = over.data.current?.type
      if (overType === 'card') {
        toIdx = colOf(cols, over.id)
        if (toIdx === -1) return prev
        insertAt = cols[toIdx].cardIds.indexOf(over.id)
      } else if (overType === 'column') {
        toIdx = cols.findIndex((c) => c.id === over.data.current.columnId)
        if (toIdx === -1) return prev
        insertAt = cols[toIdx].cardIds.length
      } else {
        return prev
      }

      if (fromIdx === toIdx) return prev // same-column reorder handled on drag end

      cols[fromIdx].cardIds = cols[fromIdx].cardIds.filter((id) => id !== cardId)
      const clamped = Math.max(0, Math.min(insertAt, cols[toIdx].cardIds.length))
      cols[toIdx].cardIds.splice(clamped, 0, cardId)
      return cols
    })
  }

  function onDragEnd({ active, over }) {
    const type = active.data.current?.type
    const working = override

    setActive(null)

    if (!over || !working) {
      setOverride(null)
      return
    }

    if (type === 'column') {
      const overColId = over.data.current?.columnId ?? over.id
      const oldIndex = working.findIndex((c) => c.id === active.id)
      const newIndex = working.findIndex((c) => c.id === overColId)
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        actions.moveColumn(oldIndex, newIndex)
      }
      setOverride(null)
      return
    }

    if (type === 'card') {
      const cols = workingCopy(working)
      const toIdx = colOf(cols, active.id)
      if (toIdx === -1) {
        setOverride(null)
        return
      }

      // Same-column reorder is resolved here.
      if (over.data.current?.type === 'card') {
        const overIdx = colOf(cols, over.id)
        if (overIdx === toIdx) {
          const arr = cols[toIdx].cardIds
          const from = arr.indexOf(active.id)
          const to = arr.indexOf(over.id)
          if (from !== -1 && to !== -1 && from !== to) {
            cols[toIdx].cardIds = arrayMove(arr, from, to)
          }
        }
      }

      const finalCol = cols[toIdx]
      const finalIndex = finalCol.cardIds.indexOf(active.id)
      actions.moveCard(active.id, finalCol.id, finalIndex)
      setOverride(null)
      return
    }

    setOverride(null)
  }

  const activeCard = active?.type === 'card' ? cards[active.id] : null
  const activeColumn =
    active?.type === 'column' ? columns.find((c) => c.id === active.id) : null
  const editingCard = editingCardId ? cards[editingCardId] : null

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={() => {
          setActive(null)
          setOverride(null)
        }}
      >
        <div className="board-scroll board-grid flex h-full items-start gap-5 overflow-x-auto px-5 py-6">
          <SortableContext items={colIds} strategy={horizontalListSortingStrategy}>
            {columns.map((column, i) => (
              <div
                key={column.id}
                className="enter h-full"
                style={{ animationDelay: `${260 + i * 70}ms` }}
              >
                <Column
                  column={column}
                  cards={column.cardIds.map((id) => cards[id]).filter(Boolean)}
                  onOpenCard={setEditingCardId}
                  activeCardId={active?.type === 'card' ? active.id : null}
                />
              </div>
            ))}
          </SortableContext>

          <button
            onClick={() => actions.addColumn(t('newColumn'))}
            className="enter group flex h-12 w-80 shrink-0 items-center justify-center gap-2 rounded-2xl border border-dashed border-cream/12 text-sm font-medium text-faint transition hover:border-accent/50 hover:bg-accent/5 hover:text-accent"
            style={{ animationDelay: `${260 + columns.length * 70}ms` }}
          >
            <span className="text-lg leading-none transition-transform group-hover:rotate-90">＋</span>
            {t('addColumn')}
          </button>
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.22,1,0.36,1)' }}>
          {activeCard ? (
            <Card card={activeCard} dragging />
          ) : activeColumn ? (
            <div className="w-80 rounded-2xl border border-accent/60 bg-ink-900/95 px-4 py-3 font-display text-base font-semibold text-cream shadow-2xl backdrop-blur">
              {activeColumn.title}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {editingCard ? (
        <CardEditor card={editingCard} onClose={() => setEditingCardId(null)} />
      ) : null}
    </>
  )
}
