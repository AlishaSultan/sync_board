import { useState } from 'react'
import { useI18n } from '../i18n.jsx'
import { USER_COLORS, suggestedColor, setUser, getUser } from '../user.js'

/**
 * Asks for a display name + color. Shown on first visit (no stored identity)
 * and again when the user clicks their own avatar to edit their profile.
 *
 * `mode === 'edit'` lets the user cancel; on first visit there's no cancel —
 * a name is required before joining.
 */
export default function NameModal({ mode = 'welcome', onClose }) {
  const { t } = useI18n()
  const existing = getUser()
  const [name, setName] = useState(existing?.name || '')
  const [color, setColor] = useState(existing?.color || suggestedColor)

  const trimmed = name.trim()
  const canSubmit = trimmed.length > 0

  const submit = (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setUser({ name: trimmed, color })
    onClose?.()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-4 backdrop-blur-md">
      <form
        onSubmit={submit}
        className="pop-in surface w-full max-w-sm overflow-hidden rounded-2xl shadow-[0_40px_90px_-30px_rgba(0,0,0,0.95)]"
      >
        {/* Warm header band */}
        <div className="relative border-b border-cream/8 bg-linear-to-br from-accent/15 to-transparent px-6 pb-5 pt-6">
          <span
            aria-hidden
            className="grid h-11 w-11 place-items-center rounded-xl bg-linear-to-br from-accent to-accent-deep text-ink-950 shadow-[0_8px_20px_-8px_rgba(245,166,35,0.9)]"
          >
            <span className="font-display text-xl font-semibold leading-none">S</span>
          </span>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-cream">
            {mode === 'edit' ? t('editProfile') : t('welcome')}
          </h2>
          {mode !== 'edit' && (
            <p className="mt-1 text-sm leading-relaxed text-sand">
              {t('welcomeSubtitle')}
            </p>
          )}
        </div>

        <div className="px-6 pb-6 pt-5">
          <span className="eyebrow">{t('yourName')}</span>
          <div className="mt-2 flex items-center gap-2.5">
            <span
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold text-ink-950 ring-2 ring-ink-950 transition-colors"
              style={{ backgroundColor: color }}
            >
              {(trimmed || '?').slice(0, 1).toUpperCase()}
            </span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={32}
              placeholder={t('namePlaceholder')}
              className="field w-full rounded-lg px-3 py-2.5 text-sm"
            />
          </div>

          <span className="eyebrow mt-5 block">{t('pickColor')}</span>
          <div className="mt-2.5 flex flex-wrap gap-2.5">
            {USER_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`h-8 w-8 rounded-full transition ${
                  color === c
                    ? 'scale-110 ring-2 ring-cream ring-offset-2 ring-offset-ink-850'
                    : 'opacity-75 hover:scale-105 hover:opacity-100'
                }`}
                aria-label={c}
              />
            ))}
          </div>

          <div className="mt-7 flex justify-end gap-2">
            {mode === 'edit' && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-sand transition hover:bg-cream/5 hover:text-cream"
              >
                {t('cancel')}
              </button>
            )}
            <button
              type="submit"
              disabled={!canSubmit}
              className="btn-accent rounded-lg px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            >
              {mode === 'edit' ? t('save') : t('joinBoard')}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
