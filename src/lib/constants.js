// Column types available in a board.
export const COLUMN_TYPES = [
  { value: 'text', label: 'טקסט', icon: 'Aa' },
  { value: 'number', label: 'מספר', icon: '#' },
  { value: 'status', label: 'סטטוס', icon: '◉' },
  { value: 'date', label: 'תאריך', icon: '📅' },
  { value: 'person', label: 'אדם אחראי', icon: '👤' },
  { value: 'checkbox', label: 'תיבת סימון', icon: '✓' },
]

// Monday-style color palette.
export const PALETTE = [
  '#00c875', // green
  '#fdab3d', // orange
  '#e2445c', // red
  '#579bfc', // blue
  '#a25ddc', // purple
  '#0086c0', // teal
  '#ff642e', // dark orange
  '#9cd326', // lime
  '#784bd1', // dark purple
  '#ff158a', // pink
  '#c4c4c4', // grey
]

// Default options for a new status column.
export const DEFAULT_STATUS_OPTIONS = [
  { label: 'בעבודה', color: '#fdab3d' },
  { label: 'תקוע', color: '#e2445c' },
  { label: 'הושלם', color: '#00c875' },
]

export const WORKSPACE_COLORS = PALETTE

export const ORG_ROLE_LABELS = { admin: 'מנהל ארגון', member: 'חבר' }
export const WS_ROLE_LABELS = { admin: 'מנהל', editor: 'עורך', viewer: 'צופה' }
