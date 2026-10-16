import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { Card, Badge } from '../../components/ui/Card'
import { Users, Building2, FileText, TrendingUp, UserCheck, Hourglass, Server, MessageCircle, ArrowUpRight } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts'
import { formatRelative, getGreeting } from '../../utils/format'
import { useAuth } from '../../context/AuthContext'

export default function AdminDashboard(){
  const { user } = useAuth()
  const [stats,setStats]=useState(null)
  const [loading,setLoading]=useState(true)
  useEffect(()=>{ (async()=>{ try{ const res=await api.getPlatformStats(); setStats(res.data) }catch(e){ console.error(e) } finally{ setLoading(false) } })() },[])
  if(loading) return <div className="page-wrap"><div className="py-16 text-center">Loading…</div></div>
  if(!stats) return <div className="page-wrap"><Card><div className="py-10 text-center text-sm text-[#0057ff]">Failed to load stats</div></Card></div>

  const FALLBACK_WEEK = [
    { name: 'Mon', users: 12 }, { name: 'Tue', users: 19 }, { name: 'Wed', users: 15 },
    { name: 'Thu', users: 22 }, { name: 'Fri', users: 18 }, { name: 'Sat', users: 26 }, { name: 'Sun', users: 30 },
  ]

  // Normalize whatever the API returns (objects with any keys, or plain numbers)
  function normalizeGrowth(growth) {
    if (!Array.isArray(growth) || growth.length === 0) return FALLBACK_WEEK
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const mapped = growth.map((g, i) => {
      if (typeof g === 'number') return { name: days[i % 7] || `D${i + 1}`, users: g }
      const rawName = g.name ?? g.label ?? g.day ?? g.date ?? g._id ?? `D${i + 1}`
      let name = String(rawName)
      const d = new Date(rawName)
      if (!Number.isNaN(d.getTime()) && /[-T/]/.test(String(rawName))) name = days[d.getDay()]
      const rawVal = g.users ?? g.value ?? g.count ?? g.total ?? 0
      return { name, users: Number(rawVal) || 0 }
    })
    return mapped.length ? mapped : FALLBACK_WEEK
  }

  const chartData = normalizeGrowth(stats.growth)
  const isLive = Array.isArray(stats.growth) && stats.growth.length > 0
  const allZero = chartData.every(d => d.users === 0)
  const weekTotal = chartData.reduce((s, d) => s + d.users, 0)
  const weekAvg = (weekTotal / Math.max(chartData.length, 1)).toFixed(1)
  const peakDay = chartData.reduce((best, d) => (d.users > (best?.users ?? -1) ? d : best), null)

  return (
    <div className="page-wrap">
      <h1 className="text-2xl font-bold text-[#0057ff] mb-1">{getGreeting()}, {user?.name?.split(' ')[0] || 'Admin'}</h1><p className="text-sm text-[#0057ff] mb-4">Admin overview · Platform health & growth</p>

      <div className="stats-grid">
        <Card><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-[#0057ff] grid place-items-center text-white"><Users size={18}/></div><div><p className="text-xs text-[#0057ff]">Total users</p><p className="text-xl font-bold text-[#0057ff]">{stats.totalUsers ?? stats.users ?? 0}</p></div></div></Card>
        <Card><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-[#14B8A6] grid place-items-center text-white"><Building2 size={18}/></div><div><p className="text-xs text-[#0057ff]">Startups</p><p className="text-xl font-bold text-[#0057ff]">{stats.totalStartups ?? 0}</p></div></div></Card>
        <Card><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-[#F5B82E] grid place-items-center text-[#1c2b4a]"><FileText size={18}/></div><div><p className="text-xs text-[#0057ff]">Reports</p><p className="text-xl font-bold text-[#0057ff]">{stats.totalReports ?? 0}</p></div></div></Card>
        <Card><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-[#FF6B6B] grid place-items-center text-white"><TrendingUp size={18}/></div><div><p className="text-xs text-[#0057ff]">Connections</p><p className="text-xl font-bold text-[#0057ff]">{stats.totalConnections ?? 0}</p></div></div></Card>
      </div>

      <div className="stats-grid mt-4">
        <Card><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-[#0057ff] grid place-items-center text-white"><Users size={18}/></div><div><p className="text-xs text-[#0057ff]">Entrepreneurs</p><p className="text-xl font-bold text-[#0057ff]">{stats.totalEntrepreneurs ?? 0}</p></div></div></Card>
        <Card><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-[#14B8A6] grid place-items-center text-white"><UserCheck size={18}/></div><div><p className="text-xs text-[#0057ff]">Investors</p><p className="text-xl font-bold text-[#0057ff]">{stats.totalInvestors ?? 0}</p></div></div></Card>
        <Card><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-[#F5B82E] grid place-items-center text-[#1c2b4a]"><MessageCircle size={18}/></div><div><p className="text-xs text-[#0057ff]">Messages</p><p className="text-xl font-bold text-[#0057ff]">{stats.totalMessages ?? 0}</p></div></div></Card>
        <Card><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-[#FF6B6B] grid place-items-center text-white"><FileText size={18}/></div><div><p className="text-xs text-[#0057ff]">Documents</p><p className="text-xl font-bold text-[#0057ff]">{stats.totalDocuments ?? 0}</p></div></div></Card>
      </div>

      <Card className="mt-6">
        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
          <h3 className="font-semibold text-sm">Growth (7 days)</h3>
          <span className="text-xs text-[#0057ff]" style={{ opacity: .7 }}>{isLive ? 'Live platform data' : 'Sample week shown'}</span>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-1 mb-4 text-sm">
          <span className="text-[#0057ff]"><strong className="font-bold">{weekTotal}</strong> <span style={{ opacity: .7 }}>new users</span></span>
          <span className="text-[#0057ff]"><strong className="font-bold">{weekAvg}</strong> <span style={{ opacity: .7 }}>/ day avg</span></span>
          {peakDay && <span className="text-[#0057ff]"><strong className="font-bold">{peakDay.name}</strong> <span style={{ opacity: .7 }}>peak ({peakDay.users})</span></span>}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -14 }}>
            <CartesianGrid stroke="#0057ff" strokeOpacity={0.12} vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#0057ff' }} axisLine={false} tickLine={false} dy={6} />
            <YAxis tick={{ fontSize: 11, fill: '#0057ff' }} axisLine={false} tickLine={false} allowDecimals={false} width={30} />
            <Tooltip
              cursor={{ fill: 'rgba(0,87,255,.07)' }}
              contentStyle={{ background: '#f8f7f4', border: '1px solid #0057ff', borderRadius: 10, color: '#0057ff', fontSize: 12 }}
              formatter={v => [`${v} new users`, '']}
              labelFormatter={l => `${l}`}
            />
            <Bar dataKey="users" radius={[6, 6, 0, 0]} maxBarSize={46}>
              {chartData.map(d => (
                <Cell key={d.name} fill={peakDay && d.name === peakDay.name && d.users > 0 ? '#14B8A6' : '#0057ff'} fillOpacity={d.users > 0 ? 1 : 0.25} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {allZero && (
          <p className="text-xs font-semibold text-[#0057ff] mt-3 rounded-full px-3 py-1.5" style={{ border: '1px dashed #0057ff', display: 'inline-block' }}>
            No new users in the last 7 days — invite founders to grow this chart.
          </p>
        )}
      </Card>

      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2"><Hourglass size={15} /> Verification queue</h3>
            <Link to="/admin/verification" className="text-xs font-bold text-[#0057ff] flex items-center gap-1">Review <ArrowUpRight size={13} /></Link>
          </div>
          {[
            ['Accounts', stats.pendingUsers ?? 0, '#F5B82E'],
            ['Startups', stats.pendingStartups ?? 0, '#0057ff'],
            ['Investor profiles', stats.pendingInvestors ?? 0, '#14B8A6'],
          ].map(([label, n, color]) => (
            <div key={label} className="flex items-center gap-3 mb-2.5">
              <span className="text-xs text-[#0057ff] w-32" style={{ flex: 'none' }}>{label}</span>
              <div style={{ flex: 1, height: 8, background: 'rgba(0,87,255,.12)' }}>
                <div style={{ height: '100%', width: `${Math.min(100, n * 12)}%`, background: color }} />
              </div>
              <strong className="text-sm text-[#0057ff] w-8 text-right">{n}</strong>
            </div>
          ))}
          {(stats.pendingUsers + stats.pendingStartups + stats.pendingInvestors) === 0 && (
            <p className="text-xs font-semibold" style={{ color: '#14B8A6' }}>Queue clear — nothing awaiting review.</p>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center gap-2"><TrendingUp size={15} /> Request pipeline</h3>
            <Link to="/admin/users" className="text-xs font-bold text-[#0057ff] flex items-center gap-1">Users <ArrowUpRight size={13} /></Link>
          </div>
          {(() => {
            const total = Math.max(1, (stats.pendingRequests ?? 0) + (stats.acceptedRequests ?? 0) + (stats.rejectedRequests ?? 0))
            return [
              ['Pending', stats.pendingRequests ?? 0, '#F5B82E'],
              ['Accepted', stats.acceptedRequests ?? 0, '#14B8A6'],
              ['Declined / cancelled', stats.rejectedRequests ?? 0, '#FF6B6B'],
            ].map(([label, n, color]) => (
              <div key={label} className="flex items-center gap-3 mb-2.5">
                <span className="text-xs text-[#0057ff] w-32" style={{ flex: 'none' }}>{label}</span>
                <div style={{ flex: 1, height: 8, background: 'rgba(0,87,255,.12)' }}>
                  <div style={{ height: '100%', width: `${Math.max(n > 0 ? 4 : 0, Math.round((n / total) * 100))}%`, background: color }} />
                </div>
                <strong className="text-sm text-[#0057ff] w-8 text-right">{n}</strong>
              </div>
            ))
          })()}
          <p className="text-xs text-[#0057ff]" style={{ opacity: .7 }}>{stats.totalRequests ?? 0} requests all time · {stats.totalConnections ?? 0} active connections</p>
        </Card>

        <Card>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Users size={15} /> Latest signups</h3>
          {(stats.recentSignups || []).length === 0 ? (
            <p className="text-xs text-[#0057ff]" style={{ opacity: .7 }}>No signups yet.</p>
          ) : (
            <div className="grid gap-2.5">
              {(stats.recentSignups || []).map(u => (
                <div key={u._id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0057ff] text-white grid place-items-center text-xs font-bold" style={{ flex: 'none' }}>
                    {(u.name || 'U').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#0057ff] truncate">{u.name} <span style={{ fontWeight: 400, opacity: .65 }}>· {u.role}</span></p>
                    <p className="text-xs text-[#0057ff]" style={{ opacity: .65 }}>{formatRelative(u.createdAt)}</p>
                  </div>
                  <Badge variant="warning">new</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Server size={15} /> System</h3>
          <div className="grid gap-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[#0057ff]">Database</span>
              <Badge variant={stats.system?.db === 'connected' ? 'success' : 'danger'}>{stats.system?.db || 'unknown'}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#0057ff]">Email service</span>
              <Badge variant={stats.system?.email === 'configured' ? 'success' : 'warning'}>{stats.system?.email || 'unknown'}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#0057ff]">Environment</span>
              <Badge>{stats.system?.env || '—'}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#0057ff]">API uptime</span>
              <span className="text-sm font-bold text-[#0057ff]">{Math.floor((stats.system?.uptimeSec || 0) / 3600)}h {Math.floor(((stats.system?.uptimeSec || 0) % 3600) / 60)}m</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#0057ff]">Pending reports</span>
              <Link to="/admin/reports" className="text-sm font-bold text-[#0057ff] flex items-center gap-1">{stats.pendingReports ?? 0} <ArrowUpRight size={13} /></Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
