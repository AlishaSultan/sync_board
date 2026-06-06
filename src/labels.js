/** Fixed label palette. A card stores label ids; this maps id → color + name. */
export const LABELS = [
  { id: 'urgent', color: '#ef4444', en: 'Urgent', ar: 'عاجل' },
  { id: 'bug', color: '#f97316', en: 'Bug', ar: 'خطأ' },
  { id: 'feature', color: '#22c55e', en: 'Feature', ar: 'ميزة' },
  { id: 'design', color: '#a855f7', en: 'Design', ar: 'تصميم' },
  { id: 'review', color: '#3b82f6', en: 'Review', ar: 'مراجعة' },
  { id: 'blocked', color: '#64748b', en: 'Blocked', ar: 'محظور' },
]

export const LABELS_BY_ID = Object.fromEntries(LABELS.map((l) => [l.id, l]))
