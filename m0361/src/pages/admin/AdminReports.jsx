import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { Card, Badge } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Flag, Inbox } from 'lucide-react'

const STATUSES = ['', 'pending', 'reviewing', 'resolved', 'dismissed']

const statusVariant = s => (s === 'pending' ? 'warning' : s === 'reviewing' ? 'default' : s === 'resolved' ? 'success' : 'muted')

export default function AdminReports() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(null)

  useEffect(() => { fetchAll() }, [status, page])

  async function fetchAll() {
    setLoading(true)
    try {
      const res = await api.getReportsAdmin({ status: status || undefined, page, limit: 15 })
      setItems(res.data || [])
      setTotal(res.pagination?.total || 0)
    } catch (e) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function setReportStatus(id, next) {
    setActing(id)
    try {
      await api.updateReportStatus(id, { status: next })
      setItems(list => list.map(r => (r._id === id ? { ...r, status: next } : r)))
    } catch (e) {
      alert(e.message)
    } finally {
      setActing(null)
    }
  }

  const pendingCount = items.filter(r => r.status === 'pending').length

  return (
    <div className="page-wrap">
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#0057ff]">Reports</h1>
          <p className="text-sm text-[#0057ff]">Spam, fraud and abuse reports from the community. Review and act.</p>
        </div>
        {pendingCount > 0 && <Badge variant="warning">{pendingCount} awaiting review</Badge>}
      </div>

      <div className="flex rounded-xl border border-[#0057ff] overflow-hidden bg-white mb-4" style={{ width: 'fit-content' }}>
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1) }}
            className={`px-4 py-2 text-sm font-semibold ${status === s ? 'bg-[#0057ff] text-white' : 'text-[#0057ff]'}`}
          >
            {s === '' ? 'All' : s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <div className="py-16 text-center text-sm text-[#0057ff]">Loading…</div> :
        items.length === 0 ? (
          <Card><div className="py-16 text-center flex flex-col items-center gap-2"><Inbox size={28} className="text-[#0057ff]" /><p className="text-sm text-[#0057ff]">Queue clear — no {status || ''} reports.</p></div></Card>
        ) : (
          <div className="grid gap-3">
            {items.map(r => (
              <Card key={r._id}>
                <div className="flex flex-wrap gap-3 items-start justify-between mb-2">
                  <div className="flex gap-3 min-w-0 items-center">
                    <div className="w-10 h-10 rounded-xl grid place-items-center text-white" style={{ flex: 'none', background: r.status === 'pending' ? '#F5B82E' : '#0057ff' }}>
                      <Flag size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#0057ff]">
                        {r.reason}
                        <span style={{ fontWeight: 400, opacity: .7 }}> · reported by {r.reporter?.name || 'unknown'}</span>
                      </p>
                      <p className="text-xs text-[#0057ff]" style={{ opacity: .75 }}>
                        {new Date(r.createdAt).toLocaleString()}
                        {r.reportedUser && <> · user: <b>{r.reportedUser?.name}</b> ({r.reportedUser?.email})</>}
                        {r.reportedStartup && <> · startup: <b>{r.reportedStartup?.name}</b></>}
                      </p>
                    </div>
                  </div>
                  <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                </div>
                <p className="text-sm text-[#0057ff] mb-3" style={{ lineHeight: 1.6 }}>{r.description}</p>
                {r.adminNotes && <p className="text-xs text-[#0057ff] mb-3" style={{ opacity: .75 }}><b>Note:</b> {r.adminNotes}</p>}
                {(r.status === 'pending' || r.status === 'reviewing') && (
                  <div className="flex gap-2 flex-wrap">
                    {r.status === 'pending' && <Button size="sm" variant="secondary" disabled={acting === r._id} onClick={() => setReportStatus(r._id, 'reviewing')}>Start review</Button>}
                    <Button size="sm" disabled={acting === r._id} onClick={() => setReportStatus(r._id, 'resolved')}>Resolve</Button>
                    <Button size="sm" variant="secondary" disabled={acting === r._id} onClick={() => setReportStatus(r._id, 'dismissed')}>Dismiss</Button>
                    {r.reportedUser && <Link to="/admin/users" style={{ textDecoration: 'none' }}><Button size="sm" variant="secondary">Open users</Button></Link>}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      <div className="flex items-center gap-2 mt-4">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
        <span className="px-3 py-1 text-sm">Page {page} · {total} reports</span>
        <Button variant="secondary" size="sm" disabled={items.length < 15} onClick={() => setPage(p => p + 1)}>Next</Button>
      </div>
    </div>
  )
}
