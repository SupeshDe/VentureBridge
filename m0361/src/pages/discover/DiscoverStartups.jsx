import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Sparkles, MapPin, Heart, Building2 } from 'lucide-react'
import api from '../../services/api'
import { Card, Badge } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Stars } from '../../components/ui/StarRating'
import { useDebounce } from '../../hooks/useDebounce'
import { formatLakhs } from '../../utils/format'
import { INDUSTRIES, STAGES } from '../../constants'

export default function DiscoverStartups(){
  const [startups,setStartups]=useState([])
  const [total,setTotal]=useState(0)
  const [loading,setLoading]=useState(true)
  const [query,setQuery]=useState('')
  const [industry,setIndustry]=useState('')
  const [stage,setStage]=useState('')
  const [minScore,setMinScore]=useState('')
  const [minRating,setMinRating]=useState('')
  const [sortBy,setSortBy]=useState('')
  const [page,setPage]=useState(1)
  const [sentByStartup,setSentByStartup]=useState({})
  const [interested,setInterested]=useState({})
  const [favouriteIds,setFavouriteIds]=useState({})
  const navigate = useNavigate()
  const debounced=useDebounce(query,400)
  const hasFilters = Boolean(query || industry || stage || minScore || minRating || sortBy)

  useEffect(()=>{ fetchData() },[debounced,industry,stage,minScore,minRating,sortBy,page])
  useEffect(()=>{
    api.getSentRequests({ limit: 50 }).then(r => {
      const m = {}
      ;(r.data || []).forEach(req => {
        if (req.status === 'pending' || req.status === 'accepted') {
          m[String(req.startup?._id || req.startup)] = req.status
        }
      })
      setSentByStartup(m)
    }).catch(()=>{})
  },[])

  useEffect(()=>{
    api.getMyInterests().then(r => {
      const m = {}
      ;(r.data || []).forEach(i => { m[String(i.startup?._id || i.startup)] = true })
      setInterested(m)
    }).catch(()=>{})
  },[])

  useEffect(()=>{
    api.getFavourites().then(r => {
      const m = {}
      ;(r.data || []).forEach(entry => {
        const id = entry.startup?._id || entry.startup
        if (id) m[String(id)] = true
      })
      setFavouriteIds(m)
    }).catch(e => console.error('Failed to load favourite startups:', e))
  },[])

  async function fetchData(){
    setLoading(true)
    try{ const res=await api.getStartups({ search:debounced||undefined, industry:industry||undefined, startupStage:stage||undefined, minScore:minScore||undefined, minRating:minRating||undefined, sort:sortBy||undefined, page, limit:12 }); setStartups(res.data||[]); setTotal(res.pagination?.total||0) }catch(e){ console.error(e); setStartups([]); setTotal(0) } finally{ setLoading(false) }
  }

  function clearFilters(){ setQuery(''); setIndustry(''); setStage(''); setMinScore(''); setMinRating(''); setSortBy(''); setPage(1) }

  async function toggleFav(s){
    const id = String(s._id)
    try {
      if (favouriteIds[id]) {
        await api.removeFavourite(id)
        setFavouriteIds(current => {
          const next = { ...current }
          delete next[id]
          return next
        })
      } else {
        await api.addFavourite(id)
        setFavouriteIds(current => ({ ...current, [id]: true }))
      }
    } catch (e) {
      alert(e.message)
    }
  }

  async function express(s){
    try{ await api.expressInterest(s._id); setInterested(m => ({ ...m, [String(s._id)]: true })); alert('Interest recorded — the founder has been notified') }catch(e){ if(e.message?.toLowerCase().includes('already')){ setInterested(m => ({ ...m, [String(s._id)]: true })); alert('You already expressed interest in this startup') } else alert(e.message) }
  }

  function requestState(s){
    return sentByStartup[String(s._id)] || null
  }

  async function connect(s){
    try{ const me=await api.getMyInvestorProfile().catch(()=>null); if(!me?.data) return alert('Create investor profile first'); await api.sendRequest({ receiver: s.owner?._id || s.owner, startup: s._id, message:'Interested to connect' }); setSentByStartup(m => ({ ...m, [String(s._id)]: 'pending' })); alert('Request sent') }catch(e){ if(e.message?.toLowerCase().includes('already')) setSentByStartup(m => ({ ...m, [String(s._id)]: 'pending' })); else alert(e.message) }
  }

  return (
    <div className="page-wrap">
      <div className="mb-6"><h1 className="text-2xl font-bold text-[#0057ff] flex items-center gap-2"><Sparkles className="text-[#0057ff]" size={22}/> Discover startups</h1><p className="text-sm text-[#0057ff]">Sourced from verified founders, ranked by thesis fit.</p></div>

      <Card className="mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[220px] flex items-center gap-2 rounded-xl border border-[#0057ff] px-3 py-2.5"><Search size={16} className="text-[#0057ff]"/><input value={query} onChange={e=>{setQuery(e.target.value); setPage(1)}} placeholder="Search startups" className="flex-1 outline-none text-sm" /></div>
          <select value={industry} onChange={e=>{setIndustry(e.target.value); setPage(1)}} className="rounded-xl border border-[#0057ff] px-3 py-2.5 text-sm bg-white"><option value="">All industries</option>{INDUSTRIES.map(i=><option key={i} value={i}>{i}</option>)}</select>
          <select value={stage} onChange={e=>{setStage(e.target.value); setPage(1)}} className="rounded-xl border border-[#0057ff] px-3 py-2.5 text-sm bg-white"><option value="">All stages</option>{STAGES.map(s=><option key={s} value={s}>{s}</option>)}</select>
          <select value={minScore} onChange={e=>{setMinScore(e.target.value); setPage(1)}} className="rounded-xl border border-[#0057ff] px-3 py-2.5 text-sm bg-white" title="Filter by match score against your investor profile"><option value="">Any fit score</option><option value="50">50%+ fit</option><option value="70">70%+ fit</option><option value="85">85%+ fit</option></select>
          <select value={minRating} onChange={e=>{setMinRating(e.target.value); setPage(1)}} className="rounded-xl border border-[#0057ff] px-3 py-2.5 text-sm bg-white" title="Filter by founder rating"><option value="">Any rating</option><option value="3">3★+ rated</option><option value="4">4★+ rated</option><option value="4.5">4.5★+ rated</option></select>
          <select value={sortBy} onChange={e=>{setSortBy(e.target.value); setPage(1)}} className="rounded-xl border border-[#0057ff] px-3 py-2.5 text-sm bg-white" title="Sort results"><option value="">Sort: newest</option><option value="-matchScore">Sort: best fit</option><option value="-rating">Sort: top rated</option></select>
          {hasFilters && !loading && <Button size="sm" variant="secondary" onClick={clearFilters}>Clear{total > 0 ? ` (${total})` : ''}</Button>}
        </div>
      </Card>

      {loading ? <div className="py-16 text-center text-sm text-[#0057ff]">Loading…</div> :
        startups.length===0 ? <Card><div className="flex flex-col items-center text-center py-14 px-6 gap-3"><h3 className="text-base font-bold text-[#0057ff]">{hasFilters ? 'No startups match those filters' : 'No verified startups yet'}</h3><p className="text-sm text-[#0057ff] max-w-md" style={{ opacity: .75 }}>{hasFilters ? 'Try widening the industry/stage or clearing your search.' : 'Verified public startup profiles will appear here once founders list and get verified.'}</p><div className="flex gap-2 mt-2 flex-wrap justify-center">{hasFilters ? <Button size="sm" onClick={clearFilters}>Clear filters</Button> : <Button size="sm" variant="secondary" onClick={fetchData}>Retry</Button>}</div></div></Card> :
        <>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {startups.map(s=> (
              <Card key={s._id} className="discover-profile-card flex flex-col">
                <div className="flex gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#0057ff] text-white grid place-items-center font-bold text-xs" style={{ flex: 'none' }}>{s.name?.slice(0,2).toUpperCase()}</div>
                  <div className="flex-1 min-w-0"><h3 className="font-semibold text-sm text-[#0057ff] flex items-center gap-1 min-w-0"><span className="truncate">{s.name}</span>{s.isVerified && <Badge variant="success">Verified</Badge>}{s.matchScore != null && <Badge variant="success" title={s.explanation}>{s.matchScore}% fit</Badge>}</h3><p className="text-xs text-[#0057ff] flex items-center gap-1"><MapPin size={12}/>{s.location||'—'} · {s.industry} · {s.startupStage}</p>{s.rating?.count > 0 && <div className="mt-1"><Stars value={s.rating.avg} count={s.rating.count} /></div>}</div>
                  <button onClick={()=>toggleFav(s)} aria-label={favouriteIds[String(s._id)] ? `Remove ${s.name} from favourites` : `Add ${s.name} to favourites`} title={favouriteIds[String(s._id)] ? 'Remove from favourites' : 'Add to favourites'} className="w-8 h-8 grid place-items-center rounded-full" style={{ border: '1px solid currentColor', color: favouriteIds[String(s._id)] ? '#ec4899' : '#0057ff', backgroundColor: favouriteIds[String(s._id)] ? '#fce7f3' : 'transparent' }}><Heart size={16} color={favouriteIds[String(s._id)] ? '#ec4899' : '#0057ff'} fill={favouriteIds[String(s._id)] ? '#ec4899' : 'none'} strokeWidth={2.4} /></button>
                </div>
                <p className="text-xs text-[#0057ff] mt-3 line-clamp-3 min-h-[48px]">{s.description||'No description.'}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}><span style={{ fontSize: 12, fontWeight: 600, color: '#fff', background: '#0057ff', borderRadius: 999, padding: '4px 11px' }}>{formatLakhs(s.fundingRequired?.amount)} raise</span><span style={{ fontSize: 12, fontWeight: 600, color: '#fff', background: '#0057ff', borderRadius: 999, padding: '4px 11px' }}>{s.equityOffered ?? '—'}% equity</span><span style={{ fontSize: 12, fontWeight: 600, color: '#0057ff', background: '#f8f7f4', border: '1px solid #f8f7f4', borderRadius: 999, padding: '4px 11px', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Building2 size={12}/>{s.owner?.name||'Founder'}</span></div>
                <div className="flex gap-2 mt-4 flex-wrap"><Button size="sm" disabled={!!requestState(s)} onClick={()=>connect(s)}>{requestState(s) === 'accepted' ? 'Connected ✓' : requestState(s) ? 'Requested ✓' : 'Connect'}</Button><Button size="sm" variant="secondary" disabled={!!interested[String(s._id)]} onClick={()=>express(s)}>{interested[String(s._id)] ? 'Interest ✓' : 'Interested'}</Button><Button size="sm" variant="secondary" onClick={()=>navigate(`/startups/${s._id}`)}>View profile</Button></div>
              </Card>
            ))}
          </div>
          <div className="flex items-center justify-between flex-wrap gap-3 mt-6 text-sm"><span className="text-[#0057ff]">{total} startups</span><div className="flex gap-2"><Button variant="secondary" size="sm" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</Button><span className="px-3 py-1 font-medium">Page {page}</span><Button variant="secondary" size="sm" disabled={startups.length<12} onClick={()=>setPage(p=>p+1)}>Next</Button></div></div>
        </>
      }


    </div>
  )
}
