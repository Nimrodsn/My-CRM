import { useEffect, useRef, useState } from 'react'

// Renders/edits a single cell value according to the column type.
// value is the raw jsonb value; onChange(newValue) persists it.
export default function CellEditor({ column, value, onChange, profiles = [], canEdit }) {
  switch (column.type) {
    case 'number':
      return <NumberCell value={value} onChange={onChange} canEdit={canEdit} />
    case 'date':
      return <DateCell value={value} onChange={onChange} canEdit={canEdit} />
    case 'checkbox':
      return <CheckboxCell value={value} onChange={onChange} canEdit={canEdit} />
    case 'status':
      return <StatusCell column={column} value={value} onChange={onChange} canEdit={canEdit} />
    case 'person':
      return <PersonCell value={value} onChange={onChange} profiles={profiles} canEdit={canEdit} />
    case 'text':
    default:
      return <TextCell value={value} onChange={onChange} canEdit={canEdit} />
  }
}

function useLocal(value) {
  const [local, setLocal] = useState(value ?? '')
  useEffect(() => setLocal(value ?? ''), [value])
  return [local, setLocal]
}

function TextCell({ value, onChange, canEdit }) {
  const [local, setLocal] = useLocal(value)
  return (
    <input
      disabled={!canEdit}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => local !== (value ?? '') && onChange(local)}
      className="h-full w-full bg-transparent px-2 text-center text-sm outline-none focus:bg-blue-50"
    />
  )
}

function NumberCell({ value, onChange, canEdit }) {
  const [local, setLocal] = useLocal(value)
  return (
    <input
      type="number"
      disabled={!canEdit}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        const num = local === '' ? null : Number(local)
        if (num !== (value ?? null)) onChange(num)
      }}
      className="h-full w-full bg-transparent px-2 text-center text-sm outline-none focus:bg-blue-50"
    />
  )
}

function DateCell({ value, onChange, canEdit }) {
  return (
    <input
      type="date"
      disabled={!canEdit}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      className="h-full w-full bg-transparent px-2 text-center text-sm outline-none focus:bg-blue-50"
    />
  )
}

function CheckboxCell({ value, onChange, canEdit }) {
  return (
    <div className="flex h-full items-center justify-center">
      <input
        type="checkbox"
        disabled={!canEdit}
        checked={!!value}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[#00c875]"
      />
    </div>
  )
}

function StatusCell({ column, value, onChange, canEdit }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const options = column.settings?.options ?? []
  const current = options.find((o) => o.label === value)
  const bg = current?.color ?? '#c4c4c4'

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div ref={ref} className="relative h-full">
      <button
        disabled={!canEdit}
        onClick={() => setOpen((o) => !o)}
        className="flex h-full w-full items-center justify-center text-sm font-medium text-white"
        style={{ background: value ? bg : '#c4c4c4' }}
      >
        {value || ''}
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-40 rounded-md bg-white p-1 shadow-lg">
          {options.map((o) => (
            <button
              key={o.label}
              onClick={() => {
                onChange(o.label)
                setOpen(false)
              }}
              className="mb-1 block w-full rounded px-2 py-1.5 text-sm font-medium text-white"
              style={{ background: o.color }}
            >
              {o.label}
            </button>
          ))}
          <button
            onClick={() => {
              onChange(null)
              setOpen(false)
            }}
            className="block w-full rounded px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            נקה
          </button>
        </div>
      )}
    </div>
  )
}

function PersonCell({ value, onChange, profiles, canEdit }) {
  return (
    <select
      disabled={!canEdit}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      className="h-full w-full bg-transparent px-2 text-center text-sm outline-none focus:bg-blue-50"
    >
      <option value="">—</option>
      {profiles.map((p) => (
        <option key={p.id} value={p.id}>
          {p.full_name || p.email}
        </option>
      ))}
    </select>
  )
}
