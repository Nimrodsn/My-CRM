import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import { WORKSPACE_COLORS, DEFAULT_STATUS_OPTIONS } from '../lib/constants'
import Modal from './ui/Modal.jsx'
import Input from './ui/Input.jsx'
import Button from './ui/Button.jsx'
import Spinner from './ui/Spinner.jsx'

export default function Sidebar() {
  const navigate = useNavigate()
  const { boardId } = useParams()
  const { profile, isOrgAdmin, canEditWorkspace, roleInWorkspace, signOut, refreshMemberships } =
    useAuth()

  const [workspaces, setWorkspaces] = useState([])
  const [boards, setBoards] = useState([])
  const [expanded, setExpanded] = useState({})
  const [loading, setLoading] = useState(true)

  const [wsModal, setWsModal] = useState(false)
  const [wsName, setWsName] = useState('')
  const [wsColor, setWsColor] = useState(WORKSPACE_COLORS[3])
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: ws }, { data: bd }] = await Promise.all([
      supabase.from('workspaces').select('*').order('created_at'),
      supabase.from('boards').select('*').order('position'),
    ])
    setWorkspaces(ws ?? [])
    setBoards(bd ?? [])
    setExpanded((prev) => {
      const next = { ...prev }
      ;(ws ?? []).forEach((w) => {
        if (next[w.id] === undefined) next[w.id] = true
      })
      return next
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function createWorkspace() {
    if (!wsName.trim()) return
    setSaving(true)
    const { error } = await supabase
      .from('workspaces')
      .insert({ name: wsName.trim(), color: wsColor, created_by: profile.id })
    setSaving(false)
    if (error) {
      alert('שגיאה ביצירת מחלקה: ' + error.message)
      return
    }
    setWsModal(false)
    setWsName('')
    await refreshMemberships()
    await load()
  }

  async function addBoard(workspaceId) {
    const name = window.prompt('שם הבורד החדש:')
    if (!name || !name.trim()) return
    const count = boards.filter((b) => b.workspace_id === workspaceId).length
    const { data, error } = await supabase
      .from('boards')
      .insert({ workspace_id: workspaceId, name: name.trim(), position: count })
      .select()
      .single()
    if (error) {
      alert('שגיאה ביצירת בורד: ' + error.message)
      return
    }
    // Seed a default group + a status column so the board isn't empty.
    await Promise.all([
      supabase.from('groups').insert({ board_id: data.id, name: 'קבוצה ראשית', color: '#579bfc', position: 0 }),
      supabase
        .from('columns')
        .insert({ board_id: data.id, name: 'סטטוס', type: 'status', settings: { options: DEFAULT_STATUS_OPTIONS }, position: 0 }),
    ])
    await load()
    navigate(`/board/${data.id}`)
  }

  async function deleteBoard(board) {
    if (!window.confirm(`למחוק את הבורד "${board.name}" וכל התוכן שבו? פעולה בלתי הפיכה.`)) return
    const { error } = await supabase.from('boards').delete().eq('id', board.id)
    if (error) {
      alert('שגיאה במחיקת בורד: ' + error.message)
      return
    }
    if (boardId === board.id) navigate('/')
    await load()
  }

  async function deleteWorkspace(ws) {
    if (
      !window.confirm(
        `למחוק את המחלקה "${ws.name}" כולל כל הבורדים והתוכן שבה? פעולה בלתי הפיכה.`
      )
    )
      return
    const inThisWs = boardsByWs(ws.id).some((b) => b.id === boardId)
    const { error } = await supabase.from('workspaces').delete().eq('id', ws.id)
    if (error) {
      alert('שגיאה במחיקת מחלקה: ' + error.message)
      return
    }
    if (inThisWs) navigate('/')
    await refreshMemberships()
    await load()
  }

  function toggle(id) {
    setExpanded((p) => ({ ...p, [id]: !p[id] }))
  }

  const canDeleteWorkspace = (id) => isOrgAdmin || roleInWorkspace(id) === 'admin'

  const boardsByWs = (id) => boards.filter((b) => b.workspace_id === id)

  return (
    <aside className="flex h-full w-64 flex-col bg-[#1f2540] text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
        <span className="text-lg font-bold">my-crm</span>
        {isOrgAdmin && (
          <Link to="/users" title="ניהול משתמשים" className="text-white/70 hover:text-white">
            ⚙️
          </Link>
        )}
      </div>

      <div className="flex-1 overflow-auto px-2 py-3">
        {loading ? (
          <Spinner />
        ) : workspaces.length === 0 ? (
          <p className="px-2 py-4 text-sm text-white/60">
            {isOrgAdmin ? 'צור מחלקה ראשונה כדי להתחיל.' : 'עדיין לא שויכת לאף מחלקה.'}
          </p>
        ) : (
          workspaces.map((ws) => (
            <div key={ws.id} className="mb-2">
              <div className="group/ws flex items-center justify-between rounded px-2 py-1 hover:bg-white/5">
                <button
                  onClick={() => toggle(ws.id)}
                  className="flex flex-1 items-center gap-2 text-right"
                >
                  <span className="text-xs">{expanded[ws.id] ? '▼' : '◀'}</span>
                  <span
                    className="h-3 w-3 rounded-sm"
                    style={{ background: ws.color }}
                  />
                  <span className="truncate text-sm font-medium">{ws.name}</span>
                </button>
                <div className="flex items-center">
                  {canEditWorkspace(ws.id) && (
                    <button
                      onClick={() => addBoard(ws.id)}
                      title="הוסף בורד"
                      className="px-1 text-white/60 hover:text-white"
                    >
                      +
                    </button>
                  )}
                  {canDeleteWorkspace(ws.id) && (
                    <button
                      onClick={() => deleteWorkspace(ws)}
                      title="מחק מחלקה"
                      className="px-1 text-white/40 opacity-0 hover:text-[#e2445c] group-hover/ws:opacity-100"
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
              {expanded[ws.id] && (
                <div className="mr-4 mt-1 flex flex-col">
                  {boardsByWs(ws.id).map((b) => (
                    <div
                      key={b.id}
                      className={`group/board flex items-center rounded ${
                        boardId === b.id ? 'bg-[#0073ea]' : 'hover:bg-white/5'
                      }`}
                    >
                      <Link
                        to={`/board/${b.id}`}
                        className={`flex-1 truncate px-3 py-1.5 text-sm ${
                          boardId === b.id ? 'text-white' : 'text-white/80'
                        }`}
                      >
                        {b.name}
                      </Link>
                      {canEditWorkspace(ws.id) && (
                        <button
                          onClick={() => deleteBoard(b)}
                          title="מחק בורד"
                          className="px-2 text-white/40 opacity-0 hover:text-[#e2445c] group-hover/board:opacity-100"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  {boardsByWs(ws.id).length === 0 && (
                    <span className="px-3 py-1 text-xs text-white/40">אין בורדים</span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="border-t border-white/10 p-3">
        {isOrgAdmin && (
          <Button
            variant="secondary"
            className="mb-2 w-full bg-white/10 text-white border-white/20 hover:bg-white/20"
            onClick={() => setWsModal(true)}
          >
            + מחלקה חדשה
          </Button>
        )}
        <div className="flex items-center justify-between px-1 text-xs text-white/70">
          <span className="truncate">{profile?.full_name || profile?.email}</span>
          <button onClick={signOut} className="hover:text-white">
            התנתק
          </button>
        </div>
      </div>

      <Modal
        open={wsModal}
        onClose={() => setWsModal(false)}
        title="מחלקה חדשה"
        footer={
          <>
            <Button variant="secondary" onClick={() => setWsModal(false)}>
              ביטול
            </Button>
            <Button onClick={createWorkspace} disabled={saving}>
              {saving ? 'יוצר...' : 'צור'}
            </Button>
          </>
        }
      >
        <label className="mb-1 block text-sm font-medium">שם המחלקה</label>
        <Input value={wsName} onChange={(e) => setWsName(e.target.value)} placeholder="למשל: שיווק" autoFocus />
        <label className="mb-1 mt-4 block text-sm font-medium">צבע</label>
        <div className="flex flex-wrap gap-2">
          {WORKSPACE_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setWsColor(c)}
              className={`h-7 w-7 rounded-full border-2 ${wsColor === c ? 'border-gray-800' : 'border-transparent'}`}
              style={{ background: c }}
            />
          ))}
        </div>
      </Modal>
    </aside>
  )
}
