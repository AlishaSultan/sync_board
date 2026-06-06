import { useSyncExternalStore, useEffect, useState } from 'react'
import { subscribe, getSnapshot, awareness, undoManager, provider } from './store.js'
import { useUser } from '../user.js'

/** The board, derived from the Y.Doc. Re-renders on any local or remote change. */
export function useBoard() {
  return useSyncExternalStore(subscribe, getSnapshot)
}

/**
 * The OTHER people currently in the room (this tab is excluded by clientID).
 * Publishing is driven by the persisted identity from `user.js`, and re-runs
 * whenever the local user changes name or color so peers see it live.
 */
export function usePresence() {
  const me = useUser()
  const [peers, setPeers] = useState([])

  useEffect(() => {
    awareness.setLocalStateField('user', me || null)

    const update = () => {
      const out = []
      awareness.getStates().forEach((state, clientId) => {
        if (clientId === awareness.clientID) return
        if (state.user) out.push(state.user)
      })
      setPeers(out)
    }
    update()
    awareness.on('change', update)
    return () => awareness.off('change', update)
  }, [me])

  return peers
}

/**
 * The live connection state to the sync server: 'connected', 'connecting', or
 * 'disconnected'. Drives the status dot in the header.
 */
export function useConnectionStatus() {
  const [status, setStatus] = useState(() =>
    provider.wsconnected ? 'connected' : 'connecting',
  )

  useEffect(() => {
    const onStatus = (e) => setStatus(e.status)
    provider.on('status', onStatus)
    // The provider is created at module load and may have already connected
    // before this listener was attached — reconcile with the live state so we
    // don't get stuck showing "connecting".
    setStatus(provider.wsconnected ? 'connected' : 'connecting')
    return () => provider.off('status', onStatus)
  }, [])

  return status
}

/**
 * Publishes this tab's pointer position over Awareness and returns the other
 * peers' cursors. Coordinates are viewport-relative; updates are throttled to
 * one per animation frame.
 */
export function useCursors() {
  const [cursors, setCursors] = useState([])

  useEffect(() => {
    let frame = null
    let pending = null

    const onMove = (e) => {
      pending = { x: e.clientX, y: e.clientY }
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = null
        awareness.setLocalStateField('cursor', pending)
      })
    }

    const onLeave = () => awareness.setLocalStateField('cursor', null)

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerleave', onLeave)

    const update = () => {
      const out = []
      awareness.getStates().forEach((state, clientId) => {
        if (clientId === awareness.clientID) return
        if (state.cursor && state.user) {
          out.push({ clientId, user: state.user, cursor: state.cursor })
        }
      })
      setCursors(out)
    }
    update()
    awareness.on('change', update)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
      awareness.off('change', update)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return cursors
}

/** Whether undo/redo are currently available, kept in sync with the manager. */
export function useUndoState() {
  const [state, setState] = useState({ canUndo: false, canRedo: false })

  useEffect(() => {
    const update = () =>
      setState({
        canUndo: undoManager.canUndo(),
        canRedo: undoManager.canRedo(),
      })
    update()
    undoManager.on('stack-item-added', update)
    undoManager.on('stack-item-popped', update)
    return () => {
      undoManager.off('stack-item-added', update)
      undoManager.off('stack-item-popped', update)
    }
  }, [])

  return state
}
