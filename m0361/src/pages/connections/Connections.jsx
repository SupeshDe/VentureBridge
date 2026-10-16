import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Card, Badge } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { MessageCircle, Users, FolderOpen, CalendarClock, Upload, Download, Trash2, Paperclip, Star } from 'lucide-react'
import { formatRelative } from '../../utils/format'
import { StarInput, ReviewsBlock } from '../../components/ui/StarRating'

function RateBox({ otherId, otherName, startupId, myId }) {
  const [stars, setStars] = useState(0)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [mine, setMine] = useState(null)

  useEffect(() => {
    let live = true
    setMine(null)
    api.getUserReviews(otherId).then(r => {
      if (!live) return
      const own = (r.data?.reviews || []).find(x => String(x.reviewer?._id || x.reviewer) === String(myId))
      if (own) {
        setMine(own)
        setStars(own.stars)
        setText(own.text || '')
      }
    }).catch(() => {})
    return () => { live = false }
  }, [otherId])

  async function submit() {
    if (!stars) return alert('Pick a star rating first')
    setSending(true)
    try {
      await api.submitReview({ revieweeId: otherId, startupId, stars, text: text.trim() })
      alert(mine ? 'Review updated' : 'Review submitted — thanks')
      setMine({ stars, text })
    } catch (e) {
      alert(e.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ border: '1px solid #F5B82E', padding: 12, display: 'grid', gap: 8 }}>
      <p className="text-xs font-bold text-[#0057ff]" style={{ margin: 0 }}>Rate {otherName || 'your connection'}</p>
      <StarInput value={stars} onChange={setStars} />
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="What worked well? (optional)" rows={2} maxLength={500} className="rounded-xl border border-[#0057ff] px-3 py-2 text-sm" />
      <div><Button size="sm" onClick={submit} loading={sending}>{mine ? 'Update review' : 'Submit review'}</Button></div>
    </div>
  )
}

// ReviewsBlock is used inside Room for the counterpart's public rating

function fmtSize(bytes) {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function fmtSlot(iso) {
  try {
    return new Date(iso).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch {
    return String(iso)
  }
}

function Room({ connection, initialTab = 'files' }) {
  const { user } = useAuth()
  const [tab, setTab] = useState(initialTab)
  const [docs, setDocs] = useState(null)
  const [meetings, setMeetings] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [slots, setSlots] = useState(['', '', ''])
  const [link, setLink] = useState('')
  const [note, setNote] = useState('')
  const [picked, setPicked] = useState({})
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)
  const myId = String(user?._id || user?.id || '')
  const participants = connection.participants?.length
    ? connection.participants
    : [connection.entrepreneur, connection.investor].filter(Boolean)
  const otherParticipant = participants.find(p => String(p._id || p.id || p) !== myId) || {}
  const otherId = String(otherParticipant._id || otherParticipant.id || '')
  const otherName = otherParticipant.name || 'Your connection'
  const roomStartupId = connection.startup?._id || connection.startup || ''

  useEffect(() => { refresh() }, [connection._id])
  useEffect(() => { setTab(initialTab) }, [connection._id, initialTab])

  async function refresh() {
    try {
      const [d, m] = await Promise.all([
        api.getConnectionDocuments(connection._id).catch(() => ({ data: [] })),
        api.getConnectionMeetings(connection._id).catch(() => ({ data: [] })),
      ])
      setDocs(d.data || [])
      setMeetings(m.data || [])
    } catch {
      setDocs([])
      setMeetings([])
    }
  }

  async function upload(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('category', 'other')
      fd.append('visibility', 'connections')
      fd.append('connectionId', connection._id)
      fd.append('description', 'Shared in data room')
      await api.uploadDocument(fd)
      await refresh()
    } catch (err) {
      alert(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function removeDoc(d) {
    if (!window.confirm(`Remove "${d.fileName}" from this data room?`)) return
    try {
      await api.deleteDocument(d.id)
      await refresh()
    } catch (e) {
      alert(e.message)
    }
  }

  async function propose(e) {
    e.preventDefault()
    const chosen = slots.filter(Boolean)
    if (!chosen.length) return alert('Pick at least one time slot')
    setBusy(true)
    try {
      await api.proposeMeeting({ connectionId: connection._id, slots: chosen, link: link.trim(), note: note.trim() })
      setSlots(['', '', ''])
      setLink('')
      setNote('')
      await refresh()
    } catch (err) {
      alert(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function respond(id, action, slot) {
    setBusy(true)
    try {
      await api.respondMeeting(id, slot ? { action, slot } : { action })
      await refresh()
    } catch (e) {
      alert(e.message)
    } finally {
      setBusy(false)
    }
  }

  function pickSlot(mid, s) {
    setPicked(prev => ({ ...prev, [mid]: s }))
  }

  const upcoming = (meetings || []).find(m => m.status === 'accepted')
  const proposed = (meetings || []).filter(m => m.status === 'proposed')

  return (
    <div style={{ borderTop: '1px solid #0057ff', marginTop: 12, paddingTop: 12 }}>
      <div className="flex gap-2 mb-3">
        <Button size="sm" variant={tab === 'files' ? 'primary' : 'secondary'} onClick={() => setTab('files')}><FolderOpen size={14} /> Files{docs ? ` (${docs.length})` : ''}</Button>
        <Button size="sm" variant={tab === 'schedule' ? 'primary' : 'secondary'} onClick={() => setTab('schedule')}><CalendarClock size={14} /> Schedule{proposed.length ? ` (${proposed.length})` : ''}</Button>
        <Button size="sm" variant={tab === 'rate' ? 'primary' : 'secondary'} onClick={() => setTab('rate')}><Star size={14} /> Rate</Button>
      </div>

      {tab === 'files' && (
        <div className="grid gap-2">
          {docs === null ? <p className="text-xs text-[#0057ff]">Loading files…</p> :
            docs.length === 0 ? <p className="text-xs text-[#0057ff]" style={{ opacity: .7 }}>No shared files yet — upload the deck, financials or anything both sides need.</p> :
            docs.map(d => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #0057ff', padding: '8px 12px' }}>
                <Paperclip size={14} className="text-[#0057ff]" style={{ flex: 'none' }} />
                <span className="text-xs font-semibold text-[#0057ff] truncate" style={{ flex: 1 }}>{d.fileName}</span>
                <span className="text-xs text-[#0057ff]" style={{ opacity: .7 }}>{d.owner?.name || ''} {fmtSize(d.fileSize)}</span>
                <a href={api.documentFileUrl(d.id)} download title="Open" style={{ color: '#0057ff', display: 'grid', placeItems: 'center' }}><Download size={14} /></a>
                {String(d.owner?.id || '') === myId && (
                  <button onClick={() => removeDoc(d)} title="Remove" style={{ background: 'none', border: 0, color: '#FF6B6B', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><Trash2 size={14} /></button>
                )}
              </div>
            ))}
          <div>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg" onChange={upload} style={{ display: 'none' }} />
            <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()} loading={uploading}><Upload size={14} /> {uploading ? 'Uploading…' : 'Share a file'}</Button>
          </div>
        </div>
      )}

      {tab === 'schedule' && (
        <div className="grid gap-3">
          {upcoming && (
            <div style={{ border: '1px solid #14B8A6', background: 'rgba(20,184,166,.08)', padding: '10px 12px' }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#14B8A6', margin: '0 0 4px' }}>Confirmed call</p>
              <p className="text-sm font-bold text-[#0057ff]" style={{ margin: 0 }}>{fmtSlot(upcoming.chosenSlot)}</p>
              {upcoming.link && <a href={upcoming.link} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#0057ff]">Join: {upcoming.link}</a>}
            </div>
          )}
          {proposed.map(m => {
            const mine = String(m.proposedBy?._id || m.proposedBy) === myId
            return (
              <div key={m._id} style={{ border: '1px solid #F5B82E', padding: '10px 12px' }}>
                <p className="text-xs font-bold text-[#0057ff]" style={{ margin: '0 0 6px' }}>
                  {mine ? 'You proposed' : `${m.proposedBy?.name || 'They'} proposed`} — pick a slot
                </p>
                <div className="grid gap-1.5 mb-2">
                  {m.slots.map(s => (
                    <label key={s} className="text-xs text-[#0057ff] flex items-center gap-2" style={{ cursor: mine ? 'default' : 'pointer' }}>
                      {!mine && <input type="radio" name={`slot-${m._id}`} checked={picked[m._id] === s} onChange={() => pickSlot(m._id, s)} />}
                      {fmtSlot(s)}
                    </label>
                  ))}
                </div>
                {m.note && <p className="text-xs text-[#0057ff] mb-2" style={{ opacity: .75 }}>{m.note}</p>}
                <div className="flex gap-2">
                  {!mine && <Button size="sm" disabled={busy || !picked[m._id]} onClick={() => respond(m._id, 'accept', picked[m._id])}>Accept</Button>}
                  {!mine && <Button size="sm" variant="secondary" disabled={busy} onClick={() => respond(m._id, 'decline')}>Decline</Button>}
                  {mine && <Button size="sm" variant="secondary" disabled={busy} onClick={() => respond(m._id, 'cancel')}>Cancel proposal</Button>}
                </div>
              </div>
            )
          })}
          <form onSubmit={propose} style={{ border: '1px dashed #0057ff', padding: 12, display: 'grid', gap: 8 }}>
            <p className="text-xs font-bold text-[#0057ff]" style={{ margin: 0 }}>Propose a call (up to 3 slots)</p>
            {slots.map((s, i) => (
              <input key={i} type="datetime-local" value={s} onChange={e => setSlots(arr => arr.map((v, j) => (j === i ? e.target.value : v)))} className="rounded-xl border border-[#0057ff] px-3 py-2 text-sm" style={{ color: '#0057ff' }} />
            ))}
            <input value={link} onChange={e => setLink(e.target.value)} placeholder="Meeting link (optional)" className="rounded-xl border border-[#0057ff] px-3 py-2 text-sm" />
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Agenda note (optional)" maxLength={500} className="rounded-xl border border-[#0057ff] px-3 py-2 text-sm" />
            <div><Button size="sm" type="submit" loading={busy}>Send proposal</Button></div>
</form>
</div>
)}
{tab === 'rate' && (
<div className="grid gap-3">
<ReviewsBlock userId={otherId} api={api} />
<RateBox otherId={otherId} otherName={otherName} startupId={roomStartupId} myId={myId} />
</div>
)}
</div>
)
}

export default function Connections() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState(null)
  const [roomTab, setRoomTab] = useState('files')

  useEffect(() => { (async () => { try { const res = await api.getConnections(); setItems(res.data || []) } finally { setLoading(false) } })() }, [])

  if (loading) return <div className="page-wrap"><div className="py-16 text-center text-sm text-[#0057ff]">Loading…</div></div>

  return (
    <div className="page-wrap">
      <h1 className="text-2xl font-bold text-[#0057ff] mb-1">Connections</h1>
      <p className="text-sm text-[#0057ff] mb-6">People you’ve connected with. Open a room to share files or schedule the first call.</p>
      {items.length === 0 ? <Card><div className="py-16 text-center flex flex-col items-center gap-2"><Users size={28} className="text-[#0057ff]" /><p className="text-sm text-[#0057ff]">No connections yet. Send a request from Discover.</p><Link to="/discover/startups" className="text-sm font-semibold text-[#0057ff]">Discover startups →</Link></div></Card> :
        <div className="grid md:grid-cols-2 gap-4">
          {items.map(c => {
            const participants = c.participants?.length
              ? c.participants
              : [c.entrepreneur, c.investor].filter(p => p && typeof p === 'object')
            const participantNames = participants.map(p => p.name).filter(Boolean).join(' ↔ ')
            const displayName = participantNames || c.startup?.name || 'Connection'
            const startupName = c.startup?.name

            return (
              <Card key={c._id} className="discover-profile-card connection-profile-card">
                <div className="flex items-center gap-4 justify-between">
                  <div className="flex gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#0057ff] text-white grid place-items-center font-bold text-xs">{displayName.slice(0, 2).toUpperCase()}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0057ff] truncate">{displayName}</p>
                      {startupName && <p className="text-xs text-[#0057ff] truncate">{startupName}</p>}
                      <p className="text-xs text-[#0057ff]">Last activity {formatRelative(c.lastActivity || c.updatedAt)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2" style={{ flex: 'none' }}>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setRoomTab('files')
                        setOpenId(id => (id === c._id ? null : c._id))
                      }}
                    >
                      Room
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setRoomTab('rate')
                        setOpenId(c._id)
                      }}
                    >
                      <Star size={14} /> Rate
                    </Button>
                    <Link to="/messages" className="px-3 py-1.5 rounded-full bg-[#0057ff] text-white text-xs font-semibold flex items-center gap-1"><MessageCircle size={14} /> Chat</Link>
                  </div>
                </div>
                {openId === c._id && <Room connection={c} initialTab={roomTab} />}
              </Card>
            )
          })}
        </div>
      }
    </div>
  )
}
