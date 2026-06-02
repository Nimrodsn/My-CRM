import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth.jsx'
import { PALETTE, DEFAULT_STATUS_OPTIONS } from '../../lib/constants'
import Spinner from '../ui/Spinner.jsx'
import Button from '../ui/Button.jsx'
import GroupSection from './GroupSection.jsx'
import AddColumnModal from './AddColumnModal.jsx'

const cellKey = (itemId, colId) => `${itemId}|${colId}`

export default function BoardView({ boardId }) {
  const { canEditWorkspace } = useAuth()
  const [board, setBoard] = useState(null)
  const [columns, setColumns] = useState([])
  const [groups, setGroups] = useState([])
  const [items, setItems] = useState([])
  const [cells, setCells] = useState({})
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [colModal, setColModal] = useState(false)

  const canEdit = board ? canEditWorkspace(board.workspace_id) : false

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data: bd, error: bErr } = await supabase
      .from('boards')
      .select('*')
      .eq('id', boardId)
      .single()
    if (bErr || !bd) {
      setError('הבורד לא נמצא או שאין לך הרשאה אליו.')
      setLoading(false)
      return
    }
    const [{ data: cols }, { data: grps }, { data: its }, { data: profs }] = await Promise.all([
      supabase.from('columns').select('*').eq('board_id', boardId).order('position'),
      supabase.from('groups').select('*').eq('board_id', boardId).order('position'),
      supabase.from('items').select('*').eq('board_id', boardId).order('position'),
      supabase.from('profiles').select('id, full_name, email'),
    ])

    let cellMap = {}
    if (its && its.length) {
      const { data: cv } = await supabase
        .from('cell_values')
        .select('item_id, column_id, value')
        .in('item_id', its.map((i) => i.id))
      ;(cv ?? []).forEach((c) => {
        cellMap[cellKey(c.item_id, c.column_id)] = c.value
      })
    }

    setBoard(bd)
    setColumns(cols ?? [])
    setGroups(grps ?? [])
    setItems(its ?? [])
    setProfiles(profs ?? [])
    setCells(cellMap)
    setLoading(false)
  }, [boardId])

  useEffect(() => {
    load()
  }, [load])

  async function addGroup() {
    const name = window.prompt('שם הקבוצה החדשה:')
    if (!name || !name.trim()) return
    const color = PALETTE[groups.length % PALETTE.length]
    const { error } = await supabase
      .from('groups')
      .insert({ board_id: boardId, name: name.trim(), color, position: groups.length })
    if (error) return alert('שגיאה: ' + error.message)
    load()
  }

  async function renameGroup(group) {
    const name = window.prompt('שם חדש לקבוצה:', group.name)
    if (!name || !name.trim()) return
    const { error } = await supabase.from('groups').update({ name: name.trim() }).eq('id', group.id)
    if (error) return alert('שגיאה: ' + error.message)
    load()
  }

  async function deleteGroup(group) {
    if (!window.confirm(`למחוק את הקבוצה "${group.name}" וכל הפריטים בה?`)) return
    const { error } = await supabase.from('groups').delete().eq('id', group.id)
    if (error) return alert('שגיאה: ' + error.message)
    load()
  }

  async function addColumn(name, type) {
    const settings = type === 'status' ? { options: DEFAULT_STATUS_OPTIONS } : {}
    const { error } = await supabase
      .from('columns')
      .insert({ board_id: boardId, name, type, settings, position: columns.length })
    if (error) return alert('שגיאה: ' + error.message)
    load()
  }

  async function renameColumn(col) {
    const name = window.prompt('שם חדש לעמודה:', col.name)
    if (!name || !name.trim()) return
    const { error } = await supabase.from('columns').update({ name: name.trim() }).eq('id', col.id)
    if (error) return alert('שגיאה: ' + error.message)
    load()
  }

  async function deleteColumn(col) {
    if (!window.confirm(`למחוק את העמודה "${col.name}" וכל הערכים שבה?`)) return
    const { error } = await supabase.from('columns').delete().eq('id', col.id)
    if (error) return alert('שגיאה: ' + error.message)
    load()
  }

  async function addItem(groupId, name) {
    const pos = items.filter((i) => i.group_id === groupId).length
    const { error } = await supabase
      .from('items')
      .insert({ board_id: boardId, group_id: groupId, name, position: pos })
    if (error) return alert('שגיאה: ' + error.message)
    load()
  }

  async function updateItemName(itemId, name) {
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, name } : i)))
    const { error } = await supabase.from('items').update({ name }).eq('id', itemId)
    if (error) alert('שגיאה בשמירה: ' + error.message)
  }

  async function deleteItem(itemId) {
    if (!window.confirm('למחוק את השורה?')) return
    setItems((prev) => prev.filter((i) => i.id !== itemId))
    const { error } = await supabase.from('items').delete().eq('id', itemId)
    if (error) {
      alert('שגיאה: ' + error.message)
      load()
    }
  }

  async function updateCell(itemId, colId, value) {
    setCells((prev) => ({ ...prev, [cellKey(itemId, colId)]: value }))
    const { error } = await supabase
      .from('cell_values')
      .upsert({ item_id: itemId, column_id: colId, value }, { onConflict: 'item_id,column_id' })
    if (error) alert('שגיאה בשמירה: ' + error.message)
  }

  if (loading) return <Spinner className="mt-20" />
  if (error)
    return <div className="p-8 text-center text-[#e2445c]">{error}</div>

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{board.name}</h1>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setColModal(true)}>
              + עמודה
            </Button>
            <Button onClick={addGroup}>+ קבוצה</Button>
          </div>
        )}
      </div>

      {!canEdit && (
        <p className="mb-4 rounded bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
          יש לך הרשאת צפייה בלבד בבורד הזה.
        </p>
      )}

      {groups.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-300 p-10 text-center text-gray-500">
          אין עדיין קבוצות בבורד.
          {canEdit && (
            <div className="mt-3">
              <Button onClick={addGroup}>צור קבוצה ראשונה</Button>
            </div>
          )}
        </div>
      ) : (
        groups.map((group) => (
          <GroupSection
            key={group.id}
            group={group}
            columns={columns}
            items={items.filter((i) => i.group_id === group.id)}
            cells={cells}
            profiles={profiles}
            canEdit={canEdit}
            onAddItem={addItem}
            onAddColumn={() => setColModal(true)}
            onRenameColumn={renameColumn}
            onDeleteColumn={deleteColumn}
            onUpdateName={updateItemName}
            onUpdateCell={updateCell}
            onDeleteItem={deleteItem}
            onRenameGroup={renameGroup}
            onDeleteGroup={deleteGroup}
          />
        ))
      )}

      <AddColumnModal open={colModal} onClose={() => setColModal(false)} onCreate={addColumn} />
    </div>
  )
}
