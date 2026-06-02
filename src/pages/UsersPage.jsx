import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import { ORG_ROLE_LABELS, WS_ROLE_LABELS } from '../lib/constants'
import Spinner from '../components/ui/Spinner.jsx'

export default function UsersPage() {
  const { isOrgAdmin } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [workspaces, setWorkspaces] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: profs }, { data: ws }, { data: mems }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at'),
      supabase.from('workspaces').select('*').order('name'),
      supabase.from('workspace_members').select('*'),
    ])
    setProfiles(profs ?? [])
    setWorkspaces(ws ?? [])
    setMembers(mems ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (!isOrgAdmin) {
    return <div className="p-8 text-center text-gray-500">אין לך הרשאה לעמוד זה.</div>
  }
  if (loading) return <Spinner className="mt-20" />

  async function setOrgRole(userId, org_role) {
    const { error } = await supabase.from('profiles').update({ org_role }).eq('id', userId)
    if (error) return alert('שגיאה: ' + error.message)
    load()
  }

  async function addMembership(userId, workspaceId, role) {
    if (!workspaceId) return
    const { error } = await supabase
      .from('workspace_members')
      .upsert({ user_id: userId, workspace_id: workspaceId, role }, { onConflict: 'workspace_id,user_id' })
    if (error) return alert('שגיאה: ' + error.message)
    load()
  }

  async function setMembershipRole(memberId, role) {
    const { error } = await supabase.from('workspace_members').update({ role }).eq('id', memberId)
    if (error) return alert('שגיאה: ' + error.message)
    load()
  }

  async function removeMembership(memberId) {
    const { error } = await supabase.from('workspace_members').delete().eq('id', memberId)
    if (error) return alert('שגיאה: ' + error.message)
    load()
  }

  const wsName = (id) => workspaces.find((w) => w.id === id)?.name ?? '—'
  const userMembers = (userId) => members.filter((m) => m.user_id === userId)
  const availableWs = (userId) =>
    workspaces.filter((w) => !members.some((m) => m.user_id === userId && m.workspace_id === w.id))

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">ניהול משתמשים</h1>
        <Link to="/" className="text-sm text-[#0073ea] hover:underline">
          ← חזרה לבורדים
        </Link>
      </div>

      <p className="mb-4 rounded bg-blue-50 px-3 py-2 text-sm text-blue-700">
        משתמשים חדשים נרשמים בעצמם דרך מסך ההתחברות. כאן אתה מגדיר את ההרשאות שלהם ומשייך אותם למחלקות.
      </p>

      <div className="space-y-4">
        {profiles.map((p) => (
          <div key={p.id} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold">{p.full_name || '—'}</div>
                <div className="text-sm text-gray-500">{p.email}</div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                תפקיד בארגון:
                <select
                  value={p.org_role}
                  onChange={(e) => setOrgRole(p.id, e.target.value)}
                  className="rounded border border-gray-300 px-2 py-1"
                >
                  {Object.entries(ORG_ROLE_LABELS).map(([v, label]) => (
                    <option key={v} value={v}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-3 border-t border-gray-100 pt-3">
              <div className="mb-2 text-sm font-medium text-gray-600">מחלקות:</div>
              <div className="flex flex-wrap gap-2">
                {userMembers(p.id).map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 rounded-full bg-gray-100 py-1 pl-2 pr-3 text-sm"
                  >
                    <span>{wsName(m.workspace_id)}</span>
                    <select
                      value={m.role}
                      onChange={(e) => setMembershipRole(m.id, e.target.value)}
                      className="rounded border border-gray-300 bg-white px-1 py-0.5 text-xs"
                    >
                      {Object.entries(WS_ROLE_LABELS).map(([v, label]) => (
                        <option key={v} value={v}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <button onClick={() => removeMembership(m.id)} className="text-gray-400 hover:text-[#e2445c]">
                      ✕
                    </button>
                  </div>
                ))}
                {userMembers(p.id).length === 0 && (
                  <span className="text-sm text-gray-400">לא משויך לאף מחלקה</span>
                )}
              </div>

              {availableWs(p.id).length > 0 && (
                <div className="mt-2">
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      addMembership(p.id, e.target.value, 'editor')
                      e.target.value = ''
                    }}
                    className="rounded border border-gray-300 px-2 py-1 text-sm"
                  >
                    <option value="">+ הוסף למחלקה (כעורך)...</option>
                    {availableWs(p.id).map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
