import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { Card } from '../components/ui/Card'
import { Heart, Building2, MapPin, TrendingUp } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { formatLakhs } from '../utils/format'

export default function Favourites(){
  const [items,setItems]=useState([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const { user } = useAuth()
  const isEntrepreneur = user?.role === 'entrepreneur'
  async function loadFavourites(){
    setLoading(true)
    setError('')
    try{
      const res=await api.getFavourites()
      setItems(res.data||[])
    }catch(e){
      setError(e.message || 'Could not load favourites.')
    }finally{
      setLoading(false)
    }
  }
  useEffect(()=>{ loadFavourites() },[])

  async function remove(id){
    try{
      if (isEntrepreneur) await api.removeInvestorFavourite(id)
      else await api.removeFavourite(id)
      setItems(current => current.filter(entry => {
        const target = isEntrepreneur ? entry.investorProfile : entry.startup
        return String(target?._id || target) !== String(id)
      }))
    }catch(e){ alert(e.message)}
  }

  if(loading) return <div className="page-wrap"><div className="py-16 text-center text-sm text-[#0057ff]">Loading…</div></div>

  return (
    <div className="page-wrap">
      <h1 className="text-2xl font-bold text-[#0057ff] mb-1 flex items-center gap-2"><Heart className="text-[#0057ff]" size={22}/> Favourites</h1><p className="text-sm text-[#0057ff] mb-6">{isEntrepreneur ? 'Your saved investor profiles.' : 'Your watchlist of promising startups.'}</p>
      {error ? <Card><div className="py-12 text-center"><p className="mb-4 text-sm text-[#0057ff]" role="alert">{error}</p><Button size="sm" onClick={loadFavourites}>Retry</Button></div></Card> :
      items.length===0 ? <Card><div className="py-16 text-center flex flex-col items-center gap-2"><Heart size={28} className="text-[#0057ff]"/><p className="text-sm text-[#0057ff]">{isEntrepreneur ? 'No favourites yet. Discover investors to save profiles.' : 'No favourites yet. Discover startups to add some.'}</p></div></Card> :
        <div className="grid md:grid-cols-2 gap-4">
          {items.map(entry=>{
            const s = isEntrepreneur ? entry.investorProfile : entry.startup
            if (!s) return null
            return (
              <Card key={s._id} className="discover-profile-card flex gap-3 flex-wrap">
                <div className="w-11 h-11 rounded-full bg-[#0057ff] text-white grid place-items-center font-bold text-xs" style={{ flex: 'none' }}>{(isEntrepreneur ? s.organization : s.name)?.slice(0,2).toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-[#0057ff] truncate">{isEntrepreneur ? s.organization : s.name}</h3>
                  <p className="text-xs text-[#0057ff] truncate flex items-center gap-1"><MapPin size={12}/>{s.location || s.user?.location || 'Location not provided'}{isEntrepreneur && s.investmentType ? ` · ${s.investmentType}` : s.industry ? ` · ${s.industry}` : ''}</p>
                  <p className="text-xs mt-1 text-[#0057ff] flex items-center gap-1">{isEntrepreneur ? <TrendingUp size={12}/> : <Building2 size={12}/>} {isEntrepreneur ? `${formatLakhs(s.investmentRange?.minimum)} – ${formatLakhs(s.investmentRange?.maximum)}` : `${formatLakhs(s.fundingRequired?.amount)} raise`}</p>
                </div>
                <Link to={isEntrepreneur ? `/investors/${s._id}` : `/startups/${s._id}`} className="no-underline">
                  <Button size="sm" variant="secondary">View profile</Button>
                </Link>
                <Button size="sm" variant="secondary" onClick={()=>remove(s._id)}>Remove</Button>
              </Card>
            )
          })}
        </div>
      }
    </div>
  )
}
