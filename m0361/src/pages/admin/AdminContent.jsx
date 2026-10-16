import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { Card, Badge } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { FileText, Download } from 'lucide-react'

const CATEGORIES = ['', 'pitch-deck', 'business-plan', 'financial', 'legal', 'other']

export default function AdminContent() {
  const [docs, setDocs] = useState([])
  const [total, setTotal] = useState(0)
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [category, page])

  async function fetchAll() {
    setLoading(true)
    try {
      const res = await api.getDocumentsAdmin({ category: category || undefined, page, limit: 15 })
      setDocs(res.data || [])
      setTotal(res.pagination?.total || 0)
    } catch (e) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function remove(d) {
    if (!window.confirm(`Delete "${d.fileName}" uploaded by ${d.owner?.email || 'unknown'}? The owner loses access too.`)) return
    try {
      await api.deleteDocumentAdmin(d._id)
      await fetchAll()
    } catch (e) {
      alert(e.message)
    }
  }

  function fmtSize(bytes) {
    if (!bytes && bytes !== 0) return '—'
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  return (
    <div className="page-wrap">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[#0057ff]">Content</h1>
        <p className="text-sm text-[#0057ff]">Every file uploaded to the platform. Remove anything abusive, malicious or irrelevant.</p>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select value={category} onChange={e => { setCategory(e.target.value); setPage(1) }} className="rounded-xl border border-[#0057ff] px-3 py-2 text-sm bg-white">
          <option value="">All categories</option>
          {CATEGORIES.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="text-sm text-[#0057ff]">{total} files</span>
      </div>

      {loading ? <div className="py-16 text-center text-sm text-[#0057ff]">Loading…</div> : (
        <Card padding={false}>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f8f7f4] text-xs text-[#0057ff]"><tr><th className="text-left px-4 py-3">File</th><th className="text-left px-4 py-3">Owner</th><th className="text-left px-4 py-3">Visibility</th><th className="text-right px-4 py-3">Actions</th></tr></thead>
              <tbody className="divide-y divide-[#0057ff]">
                {docs.map(d => (
                  <tr key={d._id} className="hover:bg-[#f8f7f4]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#0057ff] flex items-center gap-2"><FileText size={14} /> {d.fileName}</p>
                      <p className="text-xs text-[#0057ff]" style={{ opacity: .7 }}>{d.fileType?.toUpperCase()} · {fmtSize(d.fileSize)} · {d.category} · {new Date(d.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-4 py-3"><p className="text-[#0057ff]">{d.owner?.name || '—'}</p><p className="text-xs text-[#0057ff]" style={{ opacity: .7 }}>{d.owner?.email} · {d.owner?.role}</p></td>
                    <td className="px-4 py-3"><Badge variant={d.visibility === 'public' ? 'success' : 'warning'}>{d.visibility}</Badge></td>
                    <td className="px-4 py-3 text-right" style={{ whiteSpace: 'nowrap' }}>
                      <a href={`/api/documents/${d._id}/file`} download style={{ textDecoration: 'none' }}><Button size="sm" variant="secondary"><Download size={14} /></Button></a>{' '}
                      <Button size="sm" variant="danger" onClick={() => remove(d)}>Delete</Button>
                    </td>
                  </tr>
                ))}
                {docs.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-[#0057ff]">No files uploaded yet</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <div className="flex items-center gap-2 mt-4">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
        <span className="px-3 py-1 text-sm">Page {page}</span>
        <Button variant="secondary" size="sm" disabled={docs.length < 15} onClick={() => setPage(p => p + 1)}>Next</Button>
      </div>
    </div>
  )
}
