// Toolbar for searching, filtering and sorting items within a board.
export default function BoardToolbar({
  columns,
  profiles,
  search,
  setSearch,
  filters,
  setFilter,
  sort,
  setSort,
  onClear,
  visibleCount,
  totalCount,
}) {
  const statusCols = columns.filter((c) => c.type === 'status')
  const personCols = columns.filter((c) => c.type === 'person')
  const hasActive =
    !!search || Object.values(filters).some(Boolean) || !!sort.colId

  const selectClass =
    'rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-[#0073ea]'

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md border border-gray-200 bg-white p-2">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 חיפוש לפי שם..."
        className="min-w-[180px] flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-[#0073ea]"
      />

      {statusCols.map((c) => (
        <select
          key={c.id}
          value={filters[c.id] || ''}
          onChange={(e) => setFilter(c.id, e.target.value)}
          className={selectClass}
        >
          <option value="">{c.name}: הכל</option>
          {(c.settings?.options || []).map((o) => (
            <option key={o.label} value={o.label}>
              {o.label}
            </option>
          ))}
        </select>
      ))}

      {personCols.map((c) => (
        <select
          key={c.id}
          value={filters[c.id] || ''}
          onChange={(e) => setFilter(c.id, e.target.value)}
          className={selectClass}
        >
          <option value="">{c.name}: הכל</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name || p.email}
            </option>
          ))}
        </select>
      ))}

      <select
        value={sort.colId}
        onChange={(e) => setSort({ colId: e.target.value, dir: sort.dir || 'asc' })}
        className={selectClass}
        title="מיון"
      >
        <option value="">מיון: ללא</option>
        <option value="__name__">שם פריט</option>
        {columns.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      {sort.colId && (
        <button
          onClick={() => setSort({ ...sort, dir: sort.dir === 'asc' ? 'desc' : 'asc' })}
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm hover:bg-gray-50"
          title={sort.dir === 'asc' ? 'עולה' : 'יורד'}
        >
          {sort.dir === 'asc' ? '⬆' : '⬇'}
        </button>
      )}

      {hasActive && (
        <button
          onClick={onClear}
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          נקה
        </button>
      )}

      <span className="mr-auto text-xs text-gray-400">
        {visibleCount} / {totalCount} פריטים
      </span>
    </div>
  )
}
