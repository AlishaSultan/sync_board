import { useEffect, useState } from 'react'
import Board from './components/Board.jsx'
import Cursors from './components/Cursors.jsx'
import NameModal from './components/NameModal.jsx'
import { usePresence, useUndoState, useConnectionStatus } from './yjs/hooks.js'
import { actions, roomName } from './yjs/store.js'
import { useUser } from './user.js'
import { useI18n } from './i18n.jsx'

function Avatar({ user, idx, isMe, onClick }) {
  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <button
      type="button"
      onClick={onClick}
      title={isMe ? `${user.name} · edit` : user.name}
      style={{
        backgroundColor: user.color,
        marginInlineStart: idx === 0 ? 0 : -10,
        zIndex: 20 - idx,
      }}
      className={`relative flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-ink-950 ring-2 transition ${
        isMe
          ? 'cursor-pointer ring-accent hover:-translate-y-0.5'
          : 'cursor-default ring-ink-950'
      }`}
    >
      {initials}
    </button>
  )
}

const STATUS = {
  connected: { key: 'connected', dot: 'bg-online', text: 'text-online', live: true },
  connecting: { key: 'connecting', dot: 'bg-accent', text: 'text-accent', live: false },
  disconnected: { key: 'offline', dot: 'bg-faint', text: 'text-faint', live: false },
}

export default function App() {
  const { t, toggleLang } = useI18n()
  const me = useUser()
  const peers = usePresence()
  const status = useConnectionStatus()
  const { canUndo, canRedo } = useUndoState()
  const [copied, setCopied] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)

  // `peers` is already other people only (this tab is excluded by clientID).
  const others = peers.length
  const s = STATUS[status] ?? STATUS.connecting

  // Keyboard shortcuts for undo/redo.
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod || e.target.matches('input, textarea')) return
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        actions.undo()
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault()
        actions.redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard may be unavailable on insecure origins; ignore.
    }
  }

  return (
    <div className="flex h-full flex-col">
      <header className="z-30 flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-cream/8 bg-ink-950/70 px-5 py-3.5 backdrop-blur-xl">
        {/* Wordmark */}
        <div className="enter flex items-center gap-3" style={{ animationDelay: '40ms' }}>
          <span
            aria-hidden
            className="grid h-9 w-9 place-items-center rounded-xl bg-linear-to-br from-accent to-accent-deep text-ink-950 shadow-[0_8px_20px_-8px_rgba(245,166,35,0.8)]"
          >
            <span className="font-display text-lg font-semibold leading-none">S</span>
          </span>
          <div className="leading-none">
            <h1 className="font-display text-xl font-semibold tracking-tight text-cream">
              SyncBoard
            </h1>
            <span className="mt-0.5 block font-mono text-[10px] tracking-wide text-faint">
              {roomName}
            </span>
          </div>
        </div>

        {/* Connection + presence summary */}
        <div
          className="enter flex items-center gap-2.5 rounded-full border border-cream/8 bg-ink-900/60 px-3 py-1.5 text-xs"
          style={{ animationDelay: '120ms' }}
        >
          <span
            className={`h-2 w-2 rounded-full ${s.dot} ${s.live ? 'live-dot' : ''}`}
          />
          <span className={`font-medium ${s.text}`}>{t(s.key)}</span>
          <span className="h-3 w-px bg-cream/10" />
          <span className="text-sand">
            {others > 0 ? t('peerConnected', others) : t('noPeers')}
          </span>
        </div>

        <div
          className="enter ms-auto flex items-center gap-2.5"
          style={{ animationDelay: '200ms' }}
        >
          {/* Presence avatars — yours first, highlighted and clickable to edit. */}
          <div className="flex items-center pe-1">
            {me && (
              <Avatar user={me} idx={0} isMe onClick={() => setEditingProfile(true)} />
            )}
            {peers.slice(0, 4).map((u, i) => (
              <Avatar key={i} user={u} idx={me ? i + 1 : i} />
            ))}
            {others > 4 && (
              <span
                className="relative grid h-9 w-9 place-items-center rounded-full bg-ink-700 text-[11px] font-semibold text-sand ring-2 ring-ink-950"
                style={{ marginInlineStart: -10 }}
              >
                +{others - 4}
              </span>
            )}
          </div>

          {/* Undo / redo */}
          <div className="flex items-center rounded-lg border border-cream/8 bg-ink-900/60 p-0.5">
            <button
              onClick={actions.undo}
              disabled={!canUndo}
              className="rounded-md px-2.5 py-1.5 text-base text-sand transition enabled:hover:bg-cream/5 enabled:hover:text-cream disabled:opacity-25"
              title={t('undo')}
            >
              ↶
            </button>
            <button
              onClick={actions.redo}
              disabled={!canRedo}
              className="rounded-md px-2.5 py-1.5 text-base text-sand transition enabled:hover:bg-cream/5 enabled:hover:text-cream disabled:opacity-25"
              title={t('redo')}
            >
              ↷
            </button>
          </div>

          <button
            onClick={toggleLang}
            className="btn-ghost rounded-lg px-3 py-2 text-sm font-medium"
            title="Toggle language / تبديل اللغة"
          >
            {t('langToggle')}
          </button>

          <button
            onClick={copyLink}
            className="btn-accent flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold"
          >
            {copied ? (
              <>
                <span aria-hidden>✓</span>
                {t('copied')}
              </>
            ) : (
              <>
                <span aria-hidden className="text-base leading-none">⤴</span>
                {t('share')}
              </>
            )}
          </button>
        </div>
      </header>

      <main className="min-h-0 flex-1">
        <Board />
      </main>

      <Cursors />

      {/* First visit: require a name. Later: edit profile from your avatar. */}
      {!me ? (
        <NameModal mode="welcome" />
      ) : editingProfile ? (
        <NameModal mode="edit" onClose={() => setEditingProfile(false)} />
      ) : null}
    </div>
  )
}
