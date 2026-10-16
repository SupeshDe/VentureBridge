import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Check, X, Building2, UserCheck } from 'lucide-react'
import api from '../../services/api'
import { Card, Badge, IconTile } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { formatDate } from '../../utils/format'

export default function AdminVerification() {
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [startups, setStartups] = useState([])
  const [investors, setInvestors] = useState([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(null)

  useEffect(() => { fetchQueue() }, [])

  async function fetchQueue() {
    setLoading(true)
    try {
      const [u, s, inv] = await Promise.all([
        api.getUsers({ isVerified: false, limit: 50 }).catch(() => ({ data: [] })),
        api.getAllStartupsAdmin({ isVerified: false, limit: 50 }).catch(() => ({ data: [] })),
        api.getAllInvestorsAdmin({ isVerified: false, limit: 50 }).catch(() => ({ data: [] })),
      ])
      // Never show admins in their own approval queue
      setUsers((u.data || []).filter(x => x.role !== 'admin'))
      setStartups(s.data || [])
      setInvestors(inv.data || [])
    } finally {
      setLoading(false)
    }
  }

  async function approveUser(u) {
    setActing(u._id)
    try {
      await api.updateUserStatus(u._id, { isVerified: true })
      setUsers(users.filter(x => x._id !== u._id))
    } catch (e) {
      alert(e.message)
    } finally {
      setActing(null)
    }
  }

  async function rejectUser(u) {
    if (!confirm(`Reject ${u.name}? They will be deactivated and must contact support.`)) return
    setActing(u._id)
    try {
      await api.updateUserStatus(u._id, { isActive: false })
      setUsers(users.filter(x => x._id !== u._id))
    } catch (e) {
      alert(e.message)
    } finally {
      setActing(null)
    }
  }

  async function approveStartup(s) {
    setActing(s._id)
    try {
      await api.updateStartupVerification(s._id, { isVerified: true })
      setStartups(startups.filter(x => x._id !== s._id))
    } catch (e) {
      alert(e.message)
    } finally {
      setActing(null)
    }
  }

  async function approveInvestor(inv) {
    setActing(inv._id)
    try {
      await api.updateInvestorVerification(inv._id, { isVerified: true })
      setInvestors(investors.filter(x => x._id !== inv._id))
    } catch (e) {
      alert(e.message)
    } finally {
      setActing(null)
    }
  }

  if (loading) return <div className="page-wrap"><div className="py-16 text-center text-[#0057ff]">Loading queue…</div></div>

  return (
    <div className="page-wrap">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#0057ff] grid place-items-center text-white" style={{ flex: 'none' }}>
          <ShieldCheck size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#0057ff]">Verification queue</h1>
          <p className="text-sm text-[#0057ff]">Approve accounts and listings before they go live. Nothing appears in discovery until verified.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap" role="tablist" aria-label="Verification queues">
        <Button size="sm" variant={tab === 'users' ? 'primary' : 'secondary'} onClick={() => setTab('users')}>
          <UserCheck size={14} /> Pending users ({users.length})
        </Button>
        <Button size="sm" variant={tab === 'startups' ? 'primary' : 'secondary'} onClick={() => setTab('startups')}>
          <Building2 size={14} /> Pending startups ({startups.length})
        </Button>
        <Button size="sm" variant={tab === 'investors' ? 'primary' : 'secondary'} onClick={() => setTab('investors')}>
          <UserCheck size={14} /> Pending investors ({investors.length})
        </Button>
      </div>

      {tab === 'investors' ? (
        investors.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center text-center py-14 px-6 gap-3">
              <IconTile icon={Check} />
              <h3 className="text-base font-bold text-[#0057ff]">Queue clear</h3>
              <p className="text-sm text-[#0057ff] max-w-md" style={{ opacity: .75 }}>
                No investor profiles waiting. New and edited profiles land here until you approve them.
              </p>
              <Link to="/admin/users" style={{ textDecoration: 'none' }}>
                <Button size="sm" variant="secondary">View all users</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid gap-3">
            {investors.map(inv => (
              <Card key={inv._id} className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-3 min-w-0 items-center">
                  <div className="w-10 h-10 rounded-full bg-[#0057ff] text-white grid place-items-center font-bold text-xs" style={{ flex: 'none' }}>
                    {(inv.organization || 'IN').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0057ff] truncate">{inv.organization}</p>
                    <p className="text-xs text-[#0057ff] truncate">
                      {(inv.preferredIndustries || []).slice(0, 3).join(', ') || '—'} · by {inv.user?.name || 'investor'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" loading={acting === inv._id} onClick={() => approveInvestor(inv)}>
                    <Check size={14} /> Approve profile
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : tab === 'users' ? (
        users.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center text-center py-14 px-6 gap-3">
              <IconTile icon={Check} />
              <h3 className="text-base font-bold text-[#0057ff]">Queue clear</h3>
              <p className="text-sm text-[#0057ff] max-w-md" style={{ opacity: .75 }}>
                No accounts waiting. New signups land here until you approve them.
              </p>
              <Link to="/admin/users" style={{ textDecoration: 'none' }}>
                <Button size="sm" variant="secondary">View all users</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid gap-3">
            {users.map(u => (
              <Card key={u._id} className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-3 min-w-0 items-center">
                  <div className="w-10 h-10 rounded-full bg-[#0057ff] text-white grid place-items-center font-bold text-xs" style={{ flex: 'none' }}>
                    {(u.name || 'U').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0057ff] truncate">{u.name}</p>
                    <p className="text-xs text-[#0057ff] truncate">{u.email} · joined {formatDate(u.createdAt)}</p>
                  </div>
                  <Badge>{u.role}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" loading={acting === u._id} onClick={() => approveUser(u)}>
                    <Check size={14} /> Approve
                  </Button>
                  <Button size="sm" variant="secondary" disabled={acting === u._id} onClick={() => rejectUser(u)}>
                    <X size={14} /> Reject
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : startups.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center text-center py-14 px-6 gap-3">
            <IconTile icon={Check} />
            <h3 className="text-base font-bold text-[#0057ff]">Queue clear</h3>
            <p className="text-sm text-[#0057ff] max-w-md" style={{ opacity: .75 }}>
              No startup listings waiting. Unverified startups stay hidden from discovery.
            </p>
            <Link to="/admin/startups" style={{ textDecoration: 'none' }}>
              <Button size="sm" variant="secondary">View all startups</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3">
          {startups.map(s => (
            <Card key={s._id} className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-3 min-w-0 items-center">
                <div className="w-10 h-10 rounded-full bg-[#0057ff] text-white grid place-items-center font-bold text-xs" style={{ flex: 'none' }}>
                  {(s.name || 'ST').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#0057ff] truncate">{s.name}</p>
                  <p className="text-xs text-[#0057ff] truncate">
                    {s.industry || '—'} · {s.startupStage || '—'} · by {s.owner?.name || 'founder'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" loading={acting === s._id} onClick={() => approveStartup(s)}>
                  <Check size={14} /> Approve listing
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
