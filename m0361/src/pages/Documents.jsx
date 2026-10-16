import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { Card, Badge } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { FileText, Upload, Download, Trash2, Inbox } from 'lucide-react'

const CATEGORIES = [
  { value: '', label: 'All categories' },
  { value: 'pitch-deck', label: 'Pitch decks' },
  { value: 'business-plan', label: 'Business plans' },
  { value: 'financial', label: 'Financials' },
  { value: 'legal', label: 'Legal' },
  { value: 'other', label: 'Other' },
]

const VISIBILITY = [
  { value: 'private', label: 'Private — only me' },
  { value: 'connections', label: 'Connections — people I connected with' },
  { value: 'public', label: 'Public — anyone on the platform' },
]

function fmtSize(bytes) {
  if (!bytes && bytes !== 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export default function Documents() {
  const [docs, setDocs] = useState([])
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ category: 'pitch-deck', visibility: 'connections', description: '' })
  const fileRef = useRef(null)

  useEffect(() => { fetchDocs() }, [category])

  async function fetchDocs() {
    setLoading(true); setError('')
    try {
      const res = await api.getMyDocuments(category ? { category } : {})
      setDocs(res.data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function onPick(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true); setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('category', form.category)
      fd.append('visibility', form.visibility)
      fd.append('description', form.description)
      await api.uploadDocument(fd)
      setForm(f => ({ ...f, description: '' }))
      await fetchDocs()
    } catch (err) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function removeDoc(d) {
    if (!window.confirm(`Delete "${d.fileName}"? Investors with the link will lose access.`)) return
    try {
      await api.deleteDocument(d.id)
      setDocs(list => list.filter(x => x.id !== d.id))
    } catch (e) {
      alert(e.message)
    }
  }

  function copyLink(d) {
    const url = `${window.location.origin}${api.documentFileUrl(d.id)}`
    navigator.clipboard?.writeText(url).then(() => alert('Download link copied — paste it as the pitch-deck link on your startup profile.')).catch(() => alert(url))
  }

  return (
    <div className="page-wrap">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0057ff]">Documents</h1>
        <p className="text-sm text-[#0057ff]">Pitch decks, plans and financials. You control who sees each file; investors can only open what you share.</p>
      </div>

      <Card className="mb-4">
        <h2 className="text-base font-bold text-[#0057ff] mb-1">Upload a document</h2>
        <p className="text-sm text-[#0057ff] mb-4" style={{ opacity: .75 }}>PDF, Word, PowerPoint, PNG or JPG · up to 25 MB.</p>
        <div className="grid md:grid-cols-3 gap-3 mb-3">
          <label className="block text-sm font-bold text-[#0057ff]">Category
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="mt-1 w-full rounded-xl border border-[#0057ff] px-3 py-2.5 text-sm bg-white font-medium">
              {CATEGORIES.filter(c => c.value).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </label>
          <label className="block text-sm font-bold text-[#0057ff]">Who can open it
            <select value={form.visibility} onChange={e => setForm(f => ({ ...f, visibility: e.target.value }))} className="mt-1 w-full rounded-xl border border-[#0057ff] px-3 py-2.5 text-sm bg-white font-medium">
              {VISIBILITY.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
            </select>
          </label>
          <label className="block text-sm font-bold text-[#0057ff]">Note <span style={{ fontWeight: 400 }}>(optional)</span>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Seed deck, March edition" className="mt-1 w-full rounded-xl border border-[#0057ff] px-3 py-2.5 text-sm font-medium" />
          </label>
        </div>
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg" onChange={onPick} style={{ display: 'none' }} />
        <Button onClick={() => fileRef.current?.click()} loading={uploading}><Upload size={16} /> {uploading ? 'Uploading…' : 'Choose file & upload'}</Button>
        {error && <p className="text-sm font-semibold mt-3" style={{ color: '#FF6B6B' }} role="alert">{error}</p>}
      </Card>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h2 className="text-base font-bold text-[#0057ff]">My files</h2>
        <select value={category} onChange={e => setCategory(e.target.value)} className="rounded-xl border border-[#0057ff] px-3 py-2 text-sm bg-white">
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {loading ? <div className="py-16 text-center text-sm text-[#0057ff]">Loading…</div> :
        docs.length === 0 ? (
          <Card><div className="py-16 text-center flex flex-col items-center gap-2"><Inbox size={28} className="text-[#0057ff]" /><p className="text-sm text-[#0057ff]">No documents yet. Upload your pitch deck above to get started.</p></div></Card>
        ) : (
          <div className="grid gap-3">
            {docs.map(d => (
              <Card key={d.id} className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-3 min-w-0 items-center">
                  <div className="w-10 h-10 rounded-xl bg-[#0057ff] grid place-items-center text-white" style={{ flex: 'none' }}><FileText size={18} /></div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0057ff] truncate">{d.fileName}</p>
                    <p className="text-xs text-[#0057ff]" style={{ opacity: .75 }}>{d.fileType.toUpperCase()} · {fmtSize(d.fileSize)} · {new Date(d.createdAt).toLocaleDateString()}</p>
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      <Badge>{d.category}</Badge>
                      <Badge variant={d.visibility === 'public' ? 'success' : 'warning'}>{d.visibility}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <a href={api.documentFileUrl(d.id)} download className="inline-flex items-center gap-2 font-semibold rounded-xl px-5 py-2.5 text-sm border border-[#0057ff] text-[#0057ff]" style={{ textDecoration: 'none' }}><Download size={14} /> Open</a>
                  <Button size="sm" variant="secondary" onClick={() => copyLink(d)}>Copy link</Button>
                  <Button size="sm" variant="danger" onClick={() => removeDoc(d)}><Trash2 size={14} /></Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      <p className="text-xs text-[#0057ff] mt-4" style={{ opacity: .65 }}>Tip: copy a pitch-deck link and paste it into the “Pitch deck link” field on <Link to="/startup/profile" style={{ fontWeight: 700 }}>your startup profile</Link> — investors you connect with can open it from there.</p>
    </div>
  )
}
