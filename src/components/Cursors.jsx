import { useCursors } from '../yjs/hooks.js'

/** Renders other peers' live cursors as fixed-position overlays. */
export default function Cursors() {
  const cursors = useCursors()

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      {cursors.map(({ clientId, user, cursor }) => (
        <div
          key={clientId}
          className="absolute transition-transform duration-75 ease-linear"
          style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 2l7 18 2.5-7.5L20 10 3 2z"
              fill={user.color}
              stroke="#0f172a"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          <span
            className="ms-3 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold text-ink-950 shadow-lg"
            style={{ backgroundColor: user.color }}
          >
            {user.name}
          </span>
        </div>
      ))}
    </div>
  )
}
