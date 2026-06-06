import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { IndexeddbPersistence } from 'y-indexeddb'

/**
 * SyncBoard's single source of truth.
 *
 * The Y.Doc holds the whole board. React renders from it and writes back to
 * it — never the other way around. A y-websocket server keeps every device's
 * doc in sync AND persists the board, so anyone opening the same room URL sees
 * it — even on another laptop, even hours later, even if no one else is online
 * right now. y-indexeddb keeps a local copy too for instant reloads and full
 * offline editing; changes merge back to the server automatically on reconnect.
 *
 * Data model (from the spec):
 *   columns: Y.Array<Y.Map>   each { id, title, cardIds: Y.Array<string> }
 *   cards:   Y.Map<Y.Map>     each { id, title, description }
 */

// ---------------------------------------------------------------------------
// Room: everyone sharing the same room name edits the same board.
// ---------------------------------------------------------------------------
function resolveRoom() {
  const hash = window.location.hash.replace(/^#/, '').trim()
  if (hash) return hash
  // No room in the URL → mint one and put it in the hash so the link is shareable.
  const room = `board-${crypto.randomUUID().slice(0, 8)}`
  window.location.hash = room
  return room
}

export const roomName = resolveRoom()

// The sync server relays AND stores the board. By default we derive its URL
// from the page host, so opening the app at http://<lan-ip>:5173 on two devices
// makes them sync through the server on port 1234 with zero extra config.
//
// Override explicitly with VITE_WS_SERVER. In production (HTTPS) you MUST supply
// a wss:// URL here (browsers refuse ws:// from an https:// page). Run the server
// with `npm run server`.
const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
const defaultServer = `${proto}://${window.location.hostname}:1234`
export const serverUrl = import.meta.env.VITE_WS_SERVER || defaultServer

// ---------------------------------------------------------------------------
// The document + shared types.
// ---------------------------------------------------------------------------
export const ydoc = new Y.Doc()
const yColumns = ydoc.getArray('columns')
const yCards = ydoc.getMap('cards')

// Persistence first so a refresh shows the board instantly.
export const persistence = new IndexeddbPersistence(roomName, ydoc)

// Server sync. The provider connects to `${serverUrl}/${roomName}`; the server
// keeps a stored copy of each room so it survives even when no one is online.
export const provider = new WebsocketProvider(serverUrl, roomName, ydoc)
export const awareness = provider.awareness

// Built-in undo/redo over the board's shared types.
export const undoManager = new Y.UndoManager([yColumns, yCards])

// ---------------------------------------------------------------------------
// Snapshot: a stable, plain-JS view of the doc for useSyncExternalStore.
//
// getSnapshot must return a referentially stable value between changes, so we
// rebuild the cached snapshot only when the doc actually updates.
// ---------------------------------------------------------------------------
function buildSnapshot() {
  const columns = yColumns.toArray().map((col) => ({
    id: col.get('id'),
    title: col.get('title'),
    cardIds: col.get('cardIds').toArray(),
  }))

  const cards = {}
  yCards.forEach((card, id) => {
    cards[id] = {
      id: card.get('id'),
      title: card.get('title'),
      description: card.get('description') || '',
      labels: card.get('labels') || [],
      dueDate: card.get('dueDate') || '',
    }
  })

  return { columns, cards }
}

let snapshot = buildSnapshot()
const listeners = new Set()

function notify() {
  snapshot = buildSnapshot()
  listeners.forEach((l) => l())
}

// Fires for local writes, remote peer updates, and IndexedDB hydration alike.
ydoc.on('update', notify)

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getSnapshot() {
  return snapshot
}

// ---------------------------------------------------------------------------
// Seed a friendly default board once, after local persistence has loaded and
// only if no board exists yet — locally OR on the server. We must NOT seed
// before hearing from the server, or a fresh device would briefly look empty
// and stamp default columns over an existing board.
// ---------------------------------------------------------------------------
const DEFAULT_COLUMNS = ['To Do', 'In Progress', 'Done']

let seeded = false
function maybeSeed() {
  if (seeded) return
  seeded = true
  if (yColumns.length === 0) {
    ydoc.transact(() => {
      for (const title of DEFAULT_COLUMNS) {
        yColumns.push([makeColumn(title)])
      }
    })
  }
}

persistence.whenSynced.then(() => {
  // Prefer to seed only after the server has had its say. `sync(true)` fires
  // once we've received the server's state for this room; if the server is
  // unreachable (truly offline / brand-new board), fall back after a short wait.
  if (provider.synced) {
    maybeSeed()
    return
  }
  const onSync = (isSynced) => {
    if (!isSynced) return
    provider.off('sync', onSync)
    maybeSeed()
  }
  provider.on('sync', onSync)
  setTimeout(() => {
    provider.off('sync', onSync)
    maybeSeed()
  }, 1500)
})

// ---------------------------------------------------------------------------
// Factory helpers (return unattached Y types).
// ---------------------------------------------------------------------------
function makeColumn(title) {
  const col = new Y.Map()
  col.set('id', `col-${crypto.randomUUID()}`)
  col.set('title', title)
  col.set('cardIds', new Y.Array())
  return col
}

function makeCard(title, description = '') {
  const card = new Y.Map()
  const id = `card-${crypto.randomUUID()}`
  card.set('id', id)
  card.set('title', title)
  card.set('description', description)
  card.set('labels', [])
  card.set('dueDate', '')
  return { id, card }
}

function findColumn(id) {
  for (let i = 0; i < yColumns.length; i++) {
    const col = yColumns.get(i)
    if (col.get('id') === id) return { col, index: i }
  }
  return null
}

function columnContaining(cardId) {
  for (let i = 0; i < yColumns.length; i++) {
    const col = yColumns.get(i)
    if (col.get('cardIds').toArray().includes(cardId)) {
      return { col, index: i }
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Mutations — every multi-step change is one transaction so peers receive it
// atomically and undo/redo treats it as a single step.
// ---------------------------------------------------------------------------
export const actions = {
  addColumn(title = 'New Column') {
    ydoc.transact(() => yColumns.push([makeColumn(title)]))
  },

  renameColumn(columnId, title) {
    const found = findColumn(columnId)
    if (!found) return
    ydoc.transact(() => found.col.set('title', title))
  },

  deleteColumn(columnId) {
    const found = findColumn(columnId)
    if (!found) return
    const cardIds = found.col.get('cardIds').toArray()
    ydoc.transact(() => {
      yColumns.delete(found.index, 1)
      for (const id of cardIds) yCards.delete(id)
    })
  },

  moveColumn(fromIndex, toIndex) {
    if (fromIndex === toIndex) return
    const found = yColumns.get(fromIndex)
    if (!found) return
    ydoc.transact(() => {
      // Clone the column type since Y types can't be re-inserted directly.
      const clone = cloneColumn(found)
      yColumns.delete(fromIndex, 1)
      yColumns.insert(toIndex, [clone])
    })
  },

  addCard(columnId, title) {
    const text = (title || '').trim()
    if (!text) return
    const found = findColumn(columnId)
    if (!found) return
    const { id, card } = makeCard(text)
    ydoc.transact(() => {
      yCards.set(id, card)
      found.col.get('cardIds').push([id])
    })
  },

  editCard(cardId, { title, description, labels, dueDate }) {
    const card = yCards.get(cardId)
    if (!card) return
    ydoc.transact(() => {
      if (title !== undefined) card.set('title', title)
      if (description !== undefined) card.set('description', description)
      if (labels !== undefined) card.set('labels', labels)
      if (dueDate !== undefined) card.set('dueDate', dueDate)
    })
  },

  deleteCard(cardId) {
    const owner = columnContaining(cardId)
    ydoc.transact(() => {
      if (owner) {
        const cardIds = owner.col.get('cardIds')
        const idx = cardIds.toArray().indexOf(cardId)
        if (idx !== -1) cardIds.delete(idx, 1)
      }
      yCards.delete(cardId)
    })
  },

  /**
   * Move a card to a target column at a target index. Handles both reorder
   * within a column and moving between columns. Committed once on drag end.
   */
  moveCard(cardId, toColumnId, toIndex) {
    const source = columnContaining(cardId)
    const dest = findColumn(toColumnId)
    if (!dest) return

    ydoc.transact(() => {
      if (source) {
        const fromIds = source.col.get('cardIds')
        const fromIdx = fromIds.toArray().indexOf(cardId)
        if (fromIdx !== -1) fromIds.delete(fromIdx, 1)
      }
      const toIds = dest.col.get('cardIds')
      const clamped = Math.max(0, Math.min(toIndex, toIds.length))
      toIds.insert(clamped, [cardId])
    })
  },

  undo: () => undoManager.undo(),
  redo: () => undoManager.redo(),
}

function cloneColumn(col) {
  const clone = new Y.Map()
  clone.set('id', col.get('id'))
  clone.set('title', col.get('title'))
  const ids = new Y.Array()
  ids.push(col.get('cardIds').toArray())
  clone.set('cardIds', ids)
  return clone
}
