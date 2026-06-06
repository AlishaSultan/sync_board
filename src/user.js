import { useSyncExternalStore } from 'react'

/**
 * The local user's identity (display name + color).
 *
 * Unlike presence — which is ephemeral, per-tab Awareness state — identity is
 * persisted in localStorage so it stays stable across reloads and is the same
 * the next time this person opens the board on this device. No passwords; this
 * is a friendly display name, not an authenticated account.
 */

const KEY = 'sb-user'

export const USER_COLORS = [
  '#f87171', '#fb923c', '#facc15', '#4ade80',
  '#34d399', '#22d3ee', '#60a5fa', '#a78bfa', '#f472b6',
]

function randomColor() {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]
}

/** A suggested default color for the name picker, stable for this session. */
export const suggestedColor = randomColor()

function read() {
  try {
    const u = JSON.parse(localStorage.getItem(KEY))
    if (u && typeof u.name === 'string' && u.name.trim()) {
      return { name: u.name.trim(), color: u.color || randomColor() }
    }
  } catch {
    // Corrupt/old value — treat as no user.
  }
  return null
}

let current = read()
const listeners = new Set()

export function getUser() {
  return current
}

export function hasUser() {
  return current != null
}

export function setUser({ name, color }) {
  current = { name: String(name).trim(), color: color || randomColor() }
  try {
    localStorage.setItem(KEY, JSON.stringify(current))
  } catch {
    // Storage may be unavailable (private mode); identity just won't persist.
  }
  listeners.forEach((l) => l())
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Reactive access to the current identity (re-renders when it changes). */
export function useUser() {
  return useSyncExternalStore(subscribe, getUser)
}
