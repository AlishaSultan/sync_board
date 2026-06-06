# SyncBoard

A **real-time collaborative kanban board**. Open a link, share it, and everyone
edits the same board live. A small sync server keeps every device in sync **and**
stores each board, so you can open it on another laptop or browser later — even
when no one else is online — and your board is right there.

Two browser tabs (or two laptops) drag cards around and see each other's changes
instantly.

## Stack

| Concern           | Choice                  |
| ----------------- | ----------------------- |
| UI                | React + Vite            |
| Realtime sync     | Yjs (CRDT)              |
| Transport + store | y-websocket (+ LevelDB) |
| Local cache       | y-indexeddb             |
| Presence          | Yjs Awareness           |
| Identity          | localStorage            |
| Drag & drop       | dnd-kit                 |
| Styling           | Tailwind CSS v4         |
| State binding     | `useSyncExternalStore`  |

## How it works

React renders from a single `Y.Doc` and writes back to it — one source of truth.
A **y-websocket server** relays every change to all connected devices and keeps a
stored copy of each room (via LevelDB), so the board survives even when no one is
connected. `y-indexeddb` also caches a copy in each browser for instant reloads
and full offline editing; changes merge back to the server automatically on
reconnect.

```
columns: Y.Array<Y.Map>   each { id, title, cardIds: Y.Array<string> }
cards:   Y.Map<Y.Map>     each { id, title, description, labels, dueDate }
```

Card ordering lives in each column's `cardIds`; card content lives in the shared
`cards` map. Every mutation is wrapped in `ydoc.transact()` so peers receive it
atomically and undo/redo treats it as one step.

### Identity vs. presence

Your **identity** (display name + color) is saved in `localStorage`, so it's
stable across reloads and the next time you open the board on this device — no
more random "Anon Fox". On first visit you're asked for a name; click your own
avatar (the highlighted one) any time to change it. **Presence** (who's in the
room right now, live cursors) is ephemeral Yjs Awareness state layered on top.

## Run it

You need **two** processes: the sync server and the app.

```bash
npm install
npm run server   # sync + storage server on :1234 (data in ./.ydata)
npm run dev      # the app (in another terminal)
```

Open the printed URL, then open the **same URL** (including the `#board-...`
hash) in another tab, another browser, or on another laptop to see it sync.

> **Why sync used to fail across devices:** the old build synced peer-to-peer over
> WebRTC, which only works when *both* devices are online at the same moment, on
> the exact same room URL, with a reachable signaling server and NAT traversal —
> and it never stored anything centrally, so a fresh device saw an empty board.
> The y-websocket server fixes all of that: it's a single reachable endpoint that
> both relays and persists.

### Pointing the app at the server

By default the app connects to `ws(s)://<page-host>:1234`, so on a LAN you can
open `http://<your-ip>:5173/#board-…` on a second laptop with zero config (run
the server with the default `HOST=0.0.0.0`). To use a different server, set:

```bash
echo 'VITE_WS_SERVER=wss://your-server.example.com' > .env.local
npm run dev
```

In production, deploy the server (`node ./node_modules/y-websocket/bin/server.cjs`
with `YPERSISTENCE` set for durable storage) to any Node host and use a `wss://`
URL — browsers refuse `ws://` from an `https://` page.

## Features

- Pick a display name + color; persisted across reloads and devices
- Create / rename / delete columns; reorder columns by dragging
- Create / edit / delete cards (title, description, labels, due date)
- Drag cards within and between columns
- Live sync between everyone in the room, across devices and networks
- Server-side persistence — open the board later on any device and it's there
- Local cache — board survives a refresh and works offline
- Shareable room link (the URL hash is the room)
- Live presence avatars + cursors of who's in the room
- Connection status indicator (connected / connecting / offline)
- Undo / redo (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z)
- English / العربية (RTL) interface
# syncboard
# syncboard
