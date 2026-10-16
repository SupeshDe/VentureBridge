import React, { useState } from 'react'
import { Flag } from 'lucide-react'
import api from '../../services/api'

const REASONS = [
  { value: 'spam', label: 'Spam or mass outreach' },
  { value: 'fraud', label: 'Fraud or scam signals' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'fake-profile', label: 'Fake or misleading profile' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'other', label: 'Something else' },
]

/**
 * Compact "report this profile" control. Renders a flag button that
 * expands into a reason + description form inline.
 * Pass exactly one of reportedUser / reportedStartup.
 */
export default function ReportButton({ reportedUser, reportedStartup, label = 'Report' }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('spam')
  const [description, setDescription] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  async function submit() {
    if (!description.trim() || sending) return
    setSending(true)
    try {
      await api.createReport({ reportedUser, reportedStartup, reason, description: description.trim() })
      setDone(true)
    } catch (e) {
      alert(e.message)
    } finally {
      setSending(false)
    }
  }

  if (done) {
    return <span className="text-xs font-semibold text-[#14B8A6]">Reported — thanks, our team will review.</span>
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Report this profile"
        style={{ background: 'none', border: 0, cursor: 'pointer', color: '#0057ff', opacity: .65, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: 0 }}
      >
        <Flag size={13} /> {label}
      </button>
    )
  }

  return (
    <div style={{ border: '1px solid #0057ff', padding: 12, display: 'grid', gap: 8, width: '100%' }}>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#0057ff' }}>Report this profile</p>
      <select
        value={reason}
        onChange={e => setReason(e.target.value)}
        aria-label="Reason"
        style={{ border: '1px solid #0057ff', padding: '8px 10px', fontSize: 13, color: '#0057ff', background: '#f8f7f4' }}
      >
        {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
      </select>
      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="What happened? Be specific."
        rows={2}
        maxLength={1000}
        style={{ border: '1px solid #0057ff', padding: '8px 10px', fontSize: 13, color: '#0057ff', background: '#f8f7f4', resize: 'vertical' }}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={submit} disabled={sending || !description.trim()} style={{ background: '#0057ff', color: '#f8f7f4', border: '1px solid #0057ff', fontSize: 12, fontWeight: 700, padding: '8px 16px', cursor: 'pointer' }}>
          {sending ? 'Sending…' : 'Submit report'}
        </button>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 0, color: '#0057ff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}
