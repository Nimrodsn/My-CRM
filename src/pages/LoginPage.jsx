import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth.jsx'
import Input from '../components/ui/Input.jsx'
import Button from '../components/ui/Button.jsx'

export default function LoginPage() {
  const { user } = useAuth()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function submit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        })
        if (error) throw error
        setInfo('נרשמת בהצלחה! אם נדרש אימות אימייל, בדוק את תיבת הדואר. אחרת אפשר להתחבר.')
        setMode('signin')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err) {
      setError(translate(err.message))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-[#f6f7fb] p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-center text-2xl font-bold text-[#0073ea]">my-crm</h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          {mode === 'signin' ? 'התחברות למערכת' : 'יצירת חשבון'}
        </p>

        <form onSubmit={submit} className="flex flex-col gap-3">
          {mode === 'signup' && (
            <div>
              <label className="mb-1 block text-sm font-medium">שם מלא</label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">אימייל</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">סיסמה</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          {error && <p className="text-sm text-[#e2445c]">{error}</p>}
          {info && <p className="text-sm text-[#00c875]">{info}</p>}

          <Button type="submit" disabled={busy} className="mt-2 w-full">
            {busy ? 'רגע...' : mode === 'signin' ? 'התחבר' : 'הירשם'}
          </Button>
        </form>

        <button
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin')
            setError('')
            setInfo('')
          }}
          className="mt-4 w-full text-center text-sm text-[#0073ea] hover:underline"
        >
          {mode === 'signin' ? 'אין לך חשבון? הירשם' : 'כבר יש לך חשבון? התחבר'}
        </button>
      </div>
    </div>
  )
}

function translate(msg) {
  if (!msg) return 'אירעה שגיאה'
  if (msg.includes('Invalid login credentials')) return 'אימייל או סיסמה שגויים'
  if (msg.includes('already registered')) return 'האימייל כבר רשום במערכת'
  if (msg.includes('at least 6')) return 'הסיסמה חייבת להכיל לפחות 6 תווים'
  if (msg.toLowerCase().includes('invalid')) return 'כתובת האימייל אינה תקינה'
  if (msg.includes('Email not confirmed')) return 'יש לאשר את האימייל לפני התחברות'
  return msg
}
