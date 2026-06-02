import { useState } from 'react'
import Modal from '../ui/Modal.jsx'
import Input from '../ui/Input.jsx'
import Button from '../ui/Button.jsx'
import { COLUMN_TYPES } from '../../lib/constants'

export default function AddColumnModal({ open, onClose, onCreate }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('text')
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (!name.trim()) return
    setSaving(true)
    await onCreate(name.trim(), type)
    setSaving(false)
    setName('')
    setType('text')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="עמודה חדשה"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            ביטול
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? 'יוצר...' : 'הוסף'}
          </Button>
        </>
      }
    >
      <label className="mb-1 block text-sm font-medium">שם העמודה</label>
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="למשל: סטטוס" autoFocus />

      <label className="mb-1 mt-4 block text-sm font-medium">סוג</label>
      <div className="grid grid-cols-2 gap-2">
        {COLUMN_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
              type === t.value ? 'border-[#0073ea] bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="w-5 text-center">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
    </Modal>
  )
}
