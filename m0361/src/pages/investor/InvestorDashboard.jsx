import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Building2, Heart, Search, Filter, TrendingUp, Users, MessageCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { Card, Badge } from '../../components/ui/Card'
import { useDebounce } from '../../hooks/useDebounce'
import { formatLakhs, getGreeting } from '../../utils/format'

export default function InvestorDashboard(){
  const { user } = useAuth()
  const [profile,setProfile]=useState(null)
  const [matches,setMatches]=useState([])
  const [favourites,setFavourites]=useState([])
  const [connections,setConnections]=useState([])
  const [query,setQuery]=useState('')
  const debounced=useDebounce(query,400)
  const [loading,setLoading]=useState(true)
  const [sentIds,setSentIds]=useState({})
  const [sentByStartup,setSentByStartup]=useState({})

  function requestState(m){
    const id = String(m.startup?._id || '')
    if (sentIds[id]) return 'pending'
    return sentByStartup[id] || null
  }

  async function connect(m){
    if (!profile) { alert('Create investor profile first'); return }
    try {
      await api.sendRequest({ receiver: m.startup?.owner?._id || m.startup?.owner, startup: m.startup?._id, message: 'Interested to connect' })
      setSentIds(s => ({ ...s, [String(m.startup?._id)]: true }))
    } catch (e) {
      if (!e.message?.toLowerCase().includes('already')) alert(e.message)
      else setSentIds(s => ({ ...s, [String(m.startup?._id)]: true }))
    }
  }

  useEffect(()=>{ (async()=>{
    try{
      const p = await api.getMyInvestorProfile().catch(()=>({data:null}))
      setProfile(p.data)
      // Matches need a profile — skip for new users to avoid expected 404
      if (p.data) {
        const m = await api.getRecommendedStartups({ limit:12 }).catch(()=>({data:[]}))
        setMatches(m.data||[])
      } else {
        setMatches([])
      }
      const f = await api.getFavourites().catch(()=>({data:[]}))
      setFavourites(f.data||[])
      const c = await api.getConnections().catch(()=>({data:[]}))
      setConnections(c.data||[])
      const r = await api.getSentRequests({ limit: 50 }).catch(()=>({data:[]}))
      const sm = {}
      ;(r.data||[]).forEach(req => {
        if (req.status === 'pending' || req.status === 'accepted') {
          sm[String(req.startup?._id || req.startup)] = req.status
        }
      })
      setSentByStartup(sm)
    } finally{ setLoading(false) }
  })()},[])

  const filtered = useMemo(()=> matches.filter(s=> !debounced || s.startup?.name?.toLowerCase().includes(debounced.toLowerCase()) || s.startup?.industry?.toLowerCase().includes(debounced.toLowerCase())),[matches,debounced])

  if(loading) return <div className="page-wrap"><div className="py-16 text-center">Loading…</div></div>

  return (
    <div className="page-wrap">
      <section className="welcome-row">
        <div><p className="eyebrow">{new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p><h1>{getGreeting()}, {user?.name?.split(' ')[0]} <span>✦</span></h1><p className="muted">Discover startups tailored to your thesis.</p></div>
        <Link to="/investor/profile" className="primary-btn"><Building2 size={17}/> {profile?'Manage investor profile':'Create investor profile'}</Link>
      </section>

      {!profile && <div className="status-banner warning mb-6"><div className="status-icon"><Building2 size={19}/></div><div><strong>Complete your investor profile</strong><p>Create your profile to unlock smart matching and deal flow.</p></div><Link to="/investor/profile" className="text-btn">Create profile <ArrowUpRight size={15}/></Link></div>}

      <div className="stats-grid">
        <Stat label="Matches" value={matches.length} helper="curated for you" />
        <Stat label="Favourites" value={favourites.length} helper="watchlist" />
        <Stat label="Connections" value={connections.length} helper={connections.length === 1 ? 'active connection' : 'active connections'} />
        <Stat label="Thesis fit" value={matches[0]?.matchScore? `${matches[0].matchScore}%`:'—'} helper="top match" />
      </div>

      <Card>
        <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
          <div><p className="eyebrow">Curated for you</p><h2 className="text-lg font-bold">Recommended startups</h2></div>
          <Link to="/discover/startups" className="text-sm font-semibold text-[#0057ff] flex items-center gap-1">View all <ArrowUpRight size={14}/></Link>
        </div>
        <div className="flex flex-wrap gap-3 mb-4 min-w-0">
          <div className="flex-1 min-w-0 basis-[220px] flex items-center gap-2 rounded-xl border border-[#0057ff] px-3 py-2 overflow-hidden"><Search size={16} className="text-[#0057ff] shrink-0"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search startups or industries" className="flex-1 min-w-0 w-full outline-none text-sm bg-transparent" /></div>
          <button className="px-4 py-2 rounded-xl border border-[#0057ff] text-sm font-medium flex items-center gap-1 shrink-0 whitespace-nowrap" style={{ color: '#0057ff', background: '#f8f7f4' }}><Filter size={14} /> Filters</button>
        </div>

        {filtered.length===0 ? <div className="empty-state py-10 text-center text-sm text-[#0057ff]">No startups found. { !profile && 'Create your investor profile to see matches.'}</div> :
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.slice(0,6).map(m=> (
              <div key={m.startup?._id||m.startup?.name} className="rounded-2xl border border-[#0057ff] p-4 flex gap-3 hover:shadow-sm transition">
                <div className="w-10 h-10 rounded-full bg-[#0057ff] grid place-items-center text-white font-bold text-xs">{m.startup?.name?.slice(0,2).toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2"><div><h3 className="font-semibold text-sm text-[#0057ff]">{m.startup?.name}</h3><p className="text-xs text-[#0057ff]">{m.startup?.industry} · {m.startup?.startupStage} · {m.startup?.location}</p></div><Badge>{m.matchScore}% match</Badge></div>
                  <p className="text-xs text-[#0057ff] mt-1 line-clamp-2">{m.startup?.description}</p>
                  <div className="flex items-center gap-2 mt-3 flex-wrap"><span className="text-xs px-2 py-1 rounded-full bg-[#0057ff] text-white">{formatLakhs(m.startup?.fundingRequired?.amount)} raise</span>{m.startup?.equityOffered != null && <span className="text-xs px-2 py-1 rounded-full bg-[#0057ff] text-white">{m.startup.equityOffered}% equity</span>}<span className="text-xs px-2 py-1 rounded-full bg-[#0057ff] text-white flex items-center gap-1"><TrendingUp size={12} />{m.matchScore}% fit</span></div>
                  <div className="flex gap-2 mt-3"><Link to="/discover/startups" className="text-xs font-semibold text-[#0057ff]">View all</Link><button className="text-xs px-3 py-1 rounded-full bg-[#0057ff] text-white" disabled={!!requestState(m)} onClick={() => connect(m)}>{requestState(m) === 'accepted' ? 'Connected ✓' : requestState(m) ? 'Requested ✓' : 'Connect'}</button></div>
                </div>
              </div>
            ))}
          </div>
        }
      </Card>
    </div>
  )
}
function Stat({ label, value, helper }) {
  return (
    <div className="stat-card">
      <div className="stat-copy">
        <span>{label}</span>
        <strong style={{ color: '#0057ff', fontSize: 22, fontWeight: 800, fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif", lineHeight: 1.2 }}>{value}</strong>
        <small>{helper}</small>
      </div>
    </div>
  )
}
