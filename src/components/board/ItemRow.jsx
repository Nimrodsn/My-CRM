import { useEffect, useState } from 'react'
import CellEditor from './CellEditor.jsx'

export default function ItemRow({
  item,
  columns,
  template,
  cells,
  profiles,
  canEdit,
  groupColor,
  onUpdateName,
  onUpdateCell,
  onDelete,
}) {
  const [name, setName] = useState(item.name)
  useEffect(() => setName(item.name), [item.name])

  return (
    <div
      className="grid items-stretch border-b border-gray-100 bg-white hover:bg-gray-50"
      style={{ gridTemplateColumns: template }}
    >
      <div
        className="flex items-center border-r-4 px-2"
        style={{ borderColor: groupColor }}
      >
        <input
          disabled={!canEdit}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name !== item.name && onUpdateName(item.id, name)}
          placeholder="ללא שם"
          className="h-9 w-full bg-transparent text-sm font-medium outline-none focus:bg-blue-50"
        />
      </div>

      {columns.map((col) => (
        <div key={col.id} className="border-r border-gray-100">
          <CellEditor
            column={col}
            value={cells[`${item.id}|${col.id}`]}
            profiles={profiles}
            canEdit={canEdit}
            onChange={(val) => onUpdateCell(item.id, col.id, val)}
          />
        </div>
      ))}

      <div className="flex items-center justify-center">
        {canEdit && (
          <button
            onClick={() => onDelete(item.id)}
            title="מחק שורה"
            className="text-gray-300 hover:text-[#e2445c]"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
