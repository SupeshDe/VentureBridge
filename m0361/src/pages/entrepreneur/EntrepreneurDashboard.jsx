import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Bell, Building2, Check } from 'lucide-react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { formatLakhs, formatRelative, getGreeting } from '../../utils/format'
import './dashboard.css'

const AXIS = { fontSize: 11, fill: '#0057ff' }
const TIP = {
  contentStyle: { background: '#f8f7f4', border: '1px solid #0057ff', borderRadius: 10, color: '#0057ff', fontSize: 12 },
  cursor: { fill: 'rgba(0,87,255,.08)' },
}

export default function EntrepreneurDashboard() {
  const { user } = useAuth()
  const [startup, setStartup] = useState(null)
  const [matches, setMatches] = useState([])
  const [sent, setSent] = useState([])
  const [notes, setNotes] = useState([])
  const [interests, setInterests] = useState([])
  const [sentIds, setSentIds] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    try {
      const s = await api.getMyStartup().catch(() => ({ data: null }))
      setStartup(s.data)
      const [m, r, n, i] = await Promise.all([
        s.data ? api.getRecommendedInvestors({ limit: 12 }).catch(() => ({ data: [] })) : { data: [] },
        api.getSentRequests().catch(() => ({ data: [] })),
        api.getNotifications({ limit: 6 }).catch(() => ({ data: [] })),
        s.data ? api.getReceivedInterests().catch(() => ({ data: [] })) : { data: [] },
      ])
      setMatches(m.data || [])
      setSent(r.data || [])
      setNotes(n.data || [])
      setInterests(i.data || [])
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo(() => {
    const top = matches.length ? matches[0].matchScore || 0 : 0
    const pending = sent.filter(x => x.status === 'pending').length
    const accepted = sent.filter(x => x.status === 'accepted').length
    const strong = matches.filter(m => (m.matchScore || 0) >= 70).length
    const fields = [
      startup?.name, startup?.description, startup?.industry, startup?.startupStage,
      startup?.location, startup?.fundingRequired?.amount, startup?.equityOffered,
    ]
    const strength = Math.round((fields.filter(v => v !== undefined && v !== null && v !== '').length / fields.length) * 100)
    return { top, pending, accepted, strong, strength }
  }, [matches, sent, startup])

  const sectorBars = useMemo(() => {
    const c = {}
    matches.forEach(m => (m.investor?.preferredIndustries || []).forEach(i => { c[i] = (c[i] || 0) + 1 }))
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([name, count]) => ({ name, count }))
  }, [matches])

  const spark = useMemo(
    () => matches.slice(0, 8).map((m, i) => ({ n: i + 1, score: m.matchScore || 0 })),
    [matches],
  )

  const sentStatus = useMemo(() => {
    const m = {}
    sent.forEach(r => {
      if (r.status === 'pending' || r.status === 'accepted') {
        m[String(r.receiver?._id || r.receiver)] = r.status
      }
    })
    return m
  }, [sent])

  const requestState = inv => {
    if (sentIds[inv._id]) return 'pending'
    return sentStatus[String(inv?.user?._id || inv?.user || '')] || null
  }

  async function connect(inv) {
    if (!startup) return
    try {
      await api.sendRequest({ receiver: inv.user?._id || inv.user, startup: startup._id, message: 'Would love to connect' })
      setSentIds(s => ({ ...s, [inv._id]: true }))
      setSent(list => [...list, { status: 'pending', receiver: inv.user?._id || inv.user, startup: startup._id }])
    } catch (e) {
      if (!e.message?.toLowerCase().includes('already')) alert(e.message)
      else setSentIds(s => ({ ...s, [inv._id]: true }))
    }
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  if (loading) return <div className="dash-home"><div className="dash-card">Loading overview…</div></div>

  return (
    <div className="dash-home">
      <section className="dash-main">
        <header className="dash-head">
          <div>
            <p>{today}</p>
            <h2>{getGreeting()}, {user?.name?.split(' ')[0]}</h2>
          </div>
          <div className="row">
            <Link className="dash-chip ghost" to="/notifications"><Bell size={14} /> Activity</Link>
            <Link className="dash-chip" to="/startup/profile"><Building2 size={14} /> {startup ? 'Manage startup' : 'Create startup'}</Link>
          </div>
        </header>

        {!startup && (
          <div className="dash-banner">
            <Building2 size={17} />
            <span><b>Complete your startup profile</b> — matching unlocks once your raise is listed.</span>
            <Link className="dash-mini-btn solid" to="/startup/profile">Create profile <ArrowRight size={14} /></Link>
          </div>
        )}

        <div className="dash-card dash-strip">
          <div className="dash-stat"><small>Top match score</small><strong>{stats.top}%</strong></div>
          <div className="dash-stat"><small>Funding ask</small><strong>{startup ? formatLakhs(startup.fundingRequired?.amount) : '—'}</strong></div>
          <div className="dash-stat"><small>Requests sent</small><strong>{sent.length}</strong></div>
          <div className="dash-stat"><small>Investor interest</small><strong>{interests.length}</strong></div>
          <div className="dash-stat"><small>Strong fits · 70%+</small><strong>{stats.strong}</strong></div>
          <div className="dash-strength">
            <small>Profile strength · {stats.strength}%</small>
            <div className="bar"><i style={{ width: `${stats.strength}%` }} /></div>
          </div>
        </div>

        <div className="dash-grid-2">
          <div className="dash-card">
            <div className="dash-card-head">
              <div><h3>Shortlist by sector</h3><p className="sub">Where your current matches cluster.</p></div>
              <Link className="dash-link" to="/discover/investors">View all <ArrowUpRight size={13} /></Link>
            </div>
            {sectorBars.length ? (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={sectorBars} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
                  <CartesianGrid stroke="#0057ff" strokeOpacity={0.14} vertical={false} />
                  <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} interval={0} angle={-18} dy={8} height={44} />
                  <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip {...TIP} />
                  <Bar dataKey="count" fill="#0057ff" radius={[6, 6, 0, 0]} maxBarSize={34} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="dash-empty">No matches yet — complete your profile to build a shortlist.</div>
            )}
          </div>

          <div className="dash-card">
            <div className="dash-card-head">
              <div><h3>Matches right now</h3><p className="sub">Live shortlist size.</p></div>
            </div>
            <div className="dash-bignum">{matches.length}</div>
            <p className="sub">investors in range</p>
            {spark.length > 1 ? (
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={spark} margin={{ top: 10, right: 0, bottom: 0, left: 0 }}>
                  <Tooltip {...TIP} />
                  <Area type="monotone" dataKey="score" stroke="#0057ff" strokeWidth={2.5} fill="#0057ff" fillOpacity={0.16} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="dash-empty">Fit curve appears with 2+ matches.</div>
            )}
          </div>
        </div>

        <div className="dash-grid-3">
          <div className="dash-card">
            <h3>{startup?.name || 'Your startup'}</h3>
            <p className="sub">{startup ? `${startup.industry || '—'} · ${startup.startupStage || '—'} · ${startup.location || '—'}` : 'Not listed yet.'}</p>
            <div className="dash-kv"><strong>{startup ? formatLakhs(startup.fundingRequired?.amount) : '—'}</strong><span>target raise</span></div>
            <div className="dash-actions">
              <Link className="dash-mini-btn solid" to="/startup/profile">{startup ? 'Manage' : 'Create'} <ArrowRight size={13} /></Link>
              <Link className="dash-mini-btn line" to="/discover/investors">Discover</Link>
            </div>
          </div>
          <div className="dash-card">
            <h3>Pending requests</h3>
            <p className="sub">Awaiting investor response.</p>
            <div className="dash-kv"><strong>{stats.pending}</strong><span>pending · {stats.accepted} accepted</span></div>
            <div className="dash-actions">
              <Link className="dash-mini-btn line" to="/requests">Track requests <ArrowRight size={13} /></Link>
            </div>
          </div>
          <div className="dash-card">
            <h3>Accepted intros</h3>
            <p className="sub">Conversations you can start.</p>
            <div className="dash-kv"><strong>{stats.accepted}</strong><span>ready to chat</span></div>
            <div className="dash-actions">
              <Link className="dash-mini-btn line" to="/messages">Open messages <ArrowRight size={13} /></Link>
            </div>
          </div>
        </div>

        {interests.length > 0 && (
          <div className="dash-card" style={{ marginBottom: 16 }}>
            <div className="dash-card-head">
              <div><h3>Investors watching you</h3><p className="sub">They expressed interest — strike while it’s warm.</p></div>
              <Link className="dash-link" to="/requests">View all <ArrowUpRight size={13} /></Link>
            </div>
            {interests.slice(0, 3).map(i => (
              <div className="dash-match" key={i._id}>
                <span className="dash-av">{(i.investor?.name || 'IN').slice(0, 2).toUpperCase()}</span>
                <span className="tx"><b>{i.investor?.name || 'An investor'}</b><span>{i.message || 'Expressed interest'} · {formatRelative(i.createdAt)}</span></span>
              </div>
            ))}
          </div>
        )}

        <div className="dash-grid-2">
          <div className="dash-card">
            <div className="dash-card-head">
              <div><h3>Top matches</h3><p className="sub">Ranked by thesis fit.</p></div>
              <Link className="dash-link" to="/discover/investors">View all <ArrowUpRight size={13} /></Link>
            </div>
            {matches.length ? matches.slice(0, 4).map(m => {
              const inv = m.investor || {}
              const state = requestState(inv)
              const done = state === 'pending'
              const connected = state === 'accepted'
              return (
                <div className="dash-match" key={inv._id || inv.organization}>
                  <span className="dash-av">{(inv.organization || 'IN').slice(0, 2).toUpperCase()}</span>
                  <span className="tx"><b>{inv.organization}</b><span>{(inv.preferredIndustries || []).slice(0, 2).join(' · ') || inv.investmentType || 'Investor'}</span></span>
                  <span className="dash-score"><strong>{m.matchScore}%</strong><span>fit</span></span>
                  <button
                    className="dash-mini-btn solid"
                    disabled={done || connected || !startup}
                    title={!startup ? 'Create a startup profile first' : ''}
                    onClick={() => connect(inv)}
                  >
                    {connected ? <><Check size={13} /> Connected</> : done ? <><Check size={13} /> Sent</> : 'Connect'}
                  </button>
                </div>
              )
            }) : (
              <div className="dash-empty">Your ranked shortlist will appear here.</div>
            )}
          </div>

          <div className="dash-card">
            <div className="dash-card-head">
              <div><h3>Recent activity</h3><p className="sub">Latest updates.</p></div>
              <Link className="dash-link" to="/notifications">View all <ArrowUpRight size={13} /></Link>
            </div>
            {notes.length ? notes.slice(0, 5).map(n => (
              <div className="dash-act" key={n._id}>
                <span className="dash-act-ico"><Bell size={14} /></span>
                <div><b>{n.title}</b><p>{n.message}</p><small>{formatRelative(n.createdAt)}</small></div>
              </div>
            )) : (
              <div className="dash-empty">No activity yet.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
