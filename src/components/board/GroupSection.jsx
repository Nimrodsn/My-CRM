import { useState } from 'react'
import ItemRow from './ItemRow.jsx'

export default function GroupSection({
  group,
  columns,
  items,
  cells,
  profiles,
  canEdit,
  onAddItem,
  onAddColumn,
  onRenameColumn,
  onDeleteColumn,
  onUpdateName,
  onUpdateCell,
  onDeleteItem,
  onRenameGroup,
  onDeleteGroup,
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [newItem, setNewItem] = useState('')

  // name col + one per column + actions col
  const template = `minmax(240px,1fr) ${columns.map(() => '160px').join(' ')} 48px`

  function addItem() {
    if (!newItem.trim()) return
    onAddItem(group.id, newItem.trim())
    setNewItem('')
  }

  return (
    <div className="mb-6">
      <div className="mb-1 flex items-center gap-2">
        <button onClick={() => setCollapsed((c) => !c)} className="text-xs text-gray-500">
          {collapsed ? '◀' : '▼'}
        </button>
        <span
          className="cursor-pointer text-base font-semibold"
          style={{ color: group.color }}
          onClick={() => canEdit && onRenameGroup(group)}
          title={canEdit ? 'לחץ לשינוי שם' : ''}
        >
          {group.name}
        </span>
        <span className="text-xs text-gray-400">{items.length} פריטים</span>
        {canEdit && (
          <button
            onClick={() => onDeleteGroup(group)}
            className="text-xs text-gray-300 hover:text-[#e2445c]"
            title="מחק קבוצה"
          >
            🗑
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="overflow-x-auto rounded-md border border-gray-200">
          {/* header */}
          <div
            className="grid items-stretch border-b border-gray-200 bg-gray-50"
            style={{ gridTemplateColumns: template }}
          >
            <div className="border-r-4 px-3 py-2 text-sm font-medium text-gray-600" style={{ borderColor: group.color }}>
              פריט
            </div>
            {columns.map((col) => (
              <div
                key={col.id}
                className="group/col flex items-center justify-center gap-1 border-r border-gray-200 px-2 py-2 text-center text-sm font-medium text-gray-600"
              >
                <span
                  className={canEdit ? 'cursor-pointer hover:underline' : ''}
                  onClick={() => canEdit && onRenameColumn(col)}
                  title={canEdit ? 'לחץ לשינוי שם' : ''}
                >
                  {col.name}
                </span>
                {canEdit && (
                  <button
                    onClick={() => onDeleteColumn(col)}
                    title="מחק עמודה"
                    className="text-gray-300 opacity-0 hover:text-[#e2445c] group-hover/col:opacity-100"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <div className="flex items-center justify-center">
              {canEdit && (
                <button onClick={onAddColumn} title="הוסף עמודה" className="text-gray-400 hover:text-[#0073ea]">
                  +
                </button>
              )}
            </div>
          </div>

          {/* rows */}
          {items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              columns={columns}
              template={template}
              cells={cells}
              profiles={profiles}
              canEdit={canEdit}
              groupColor={group.color}
              onUpdateName={onUpdateName}
              onUpdateCell={onUpdateCell}
              onDelete={onDeleteItem}
            />
          ))}

          {/* add item */}
          {canEdit && (
            <div className="grid items-stretch bg-white" style={{ gridTemplateColumns: template }}>
              <div className="border-r-4 px-2" style={{ borderColor: group.color }}>
                <input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addItem()}
                  onBlur={addItem}
                  placeholder="+ הוסף פריט"
                  className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-gray-400 focus:bg-blue-50"
                />
              </div>
              <div style={{ gridColumn: `span ${columns.length + 1}` }} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
