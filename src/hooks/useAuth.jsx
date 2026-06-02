import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [memberships, setMemberships] = useState([]) // [{workspace_id, role}]
  const [loading, setLoading] = useState(true)

  const loadUserData = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      setMemberships([])
      return
    }
    const [{ data: prof }, { data: mems }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('workspace_members').select('workspace_id, role').eq('user_id', userId),
    ])
    setProfile(prof ?? null)
    setMemberships(mems ?? [])
  }, [])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setSession(session)
      loadUserData(session?.user?.id).finally(() => {
        if (mounted) setLoading(false)
      })
    })

    // NOTE: do NOT `await` supabase queries directly inside this callback —
    // it deadlocks the GoTrue auth lock on page reload. Defer with setTimeout.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setSession(session)
      setTimeout(() => {
        if (mounted) loadUserData(session?.user?.id)
      }, 0)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadUserData])

  const refreshMemberships = useCallback(
    () => loadUserData(session?.user?.id),
    [loadUserData, session]
  )

  const signOut = () => supabase.auth.signOut()

  const isOrgAdmin = profile?.org_role === 'admin'

  const roleInWorkspace = useCallback(
    (workspaceId) => memberships.find((m) => m.workspace_id === workspaceId)?.role ?? null,
    [memberships]
  )

  const canEditWorkspace = useCallback(
    (workspaceId) => isOrgAdmin || ['admin', 'editor'].includes(roleInWorkspace(workspaceId)),
    [isOrgAdmin, roleInWorkspace]
  )

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    memberships,
    loading,
    isOrgAdmin,
    roleInWorkspace,
    canEditWorkspace,
    refreshMemberships,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
