import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { Card, Badge } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { formatLakhs } from '../../utils/format'

export default function AdminInvestors() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    try {
      const res = await api.getAllInvestorsAdmin({ limit: 50 })
      setItems(res.data || [])
    } catch (e) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function verify(id, isVerified) {
    try {
      await api.updateInvestorVerification(id, { isVerified })
      setItems(items.map(x => (x._id === id ? { ...x, isVerified } : x)))
    } catch (e) {
      alert(e.message)
    }
  }

  if (loading) return <div className="page-wrap"><div className="py-16 text-center">Loading…</div></div>

  return (
    <div className="page-wrap">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[#0057ff]">Investors</h1>
        <p className="text-sm text-[#0057ff]">Every investor profile, thesis and verification state.</p>
      </div>
      <div className="grid gap-3">
        {items.map(inv => (
          <Card key={inv._id} className="admin-directory-card flex flex-wrap gap-4 items-center justify-between">
            <div className="min-w-0">
              <p className="font-semibold text-sm text-[#0057ff]">{inv.organization}</p>
              <p className="text-xs text-[#0057ff]" style={{ opacity: .75 }}>
                {inv.user?.name || '—'} · {inv.user?.email || ''} · {inv.location || '—'}
              </p>
              <p className="text-xs text-[#0057ff]" style={{ opacity: .75 }}>
                {(inv.preferredIndustries || []).slice(0, 3).join(' · ') || 'No sectors'} · {formatLakhs(inv.investmentRange?.minimum)} – {formatLakhs(inv.investmentRange?.maximum)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={inv.isVerified ? 'success' : 'warning'}>{inv.isVerified ? 'Verified' : 'Pending'}</Badge>
              <Link to={`/admin/profiles/investor/${inv._id}`} className="no-underline">
                <Button size="sm" variant="secondary">View profile</Button>
              </Link>
              <Button size="sm" variant="secondary" onClick={() => verify(inv._id, !inv.isVerified)}>{inv.isVerified ? 'Unverify' : 'Verify'}</Button>
            </div>
          </Card>
        ))}
        {items.length === 0 && <Card><div className="py-10 text-center text-sm text-[#0057ff]">No investor profiles</div></Card>}
      </div>
    </div>
  )
}
