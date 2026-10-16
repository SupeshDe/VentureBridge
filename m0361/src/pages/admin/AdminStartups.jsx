import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { Card, Badge } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

export default function AdminStartups(){
  const [items,setItems]=useState([])
  const [loading,setLoading]=useState(true)
  useEffect(()=>{ (async()=>{ try{ const res=await api.getAllStartupsAdmin(); setItems(res.data||[]) } finally{ setLoading(false) } })() },[])

  async function verify(id, isVerified){
    try{ await api.updateStartupVerification(id, { isVerified }); setItems(items.map(s=> s._id===id? {...s,isVerified}:s ))}catch(e){ alert(e.message)}
  }

  if(loading) return <div className="page-wrap"><div className="py-16 text-center">Loading…</div></div>

  return (
    <div className="page-wrap">
      <h1 className="text-2xl font-bold text-[#0057ff] mb-4">Startups</h1>
      <div className="grid gap-3">
        {items.map(s=> (
          <Card key={s._id} className="admin-directory-card flex flex-wrap gap-4 items-center justify-between">
            <div><p className="font-semibold text-sm text-[#0057ff]">{s.name}</p><p className="text-xs text-[#0057ff]">{s.industry} · {s.startupStage} · {s.owner?.name}</p></div>
            <div className="flex items-center gap-2"><Badge variant={s.isVerified?'success':'warning'}>{s.isVerified?'Verified':'Pending'}</Badge><Link to={`/admin/profiles/startup/${s._id}`} className="no-underline"><Button size="sm" variant="secondary">View profile</Button></Link><Button size="sm" variant="secondary" onClick={()=>verify(s._id, !s.isVerified)}>{s.isVerified?'Unverify':'Verify'}</Button></div>
          </Card>
        ))}
        {items.length===0 && <Card><div className="py-10 text-center text-sm text-[#0057ff]">No startups</div></Card>}
      </div>
    </div>
  )
}
