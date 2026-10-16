import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { Card, Badge } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Check, X, Clock, Inbox, Heart } from 'lucide-react'

export default function Requests(){
  const { user } = useAuth()
  const isEntrepreneur = user?.role === 'entrepreneur'
  const isInvestor = user?.role === 'investor'
  const [tab,setTab]=useState('received')
  const [items,setItems]=useState([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [acting,setActing]=useState(null)

  useEffect(()=>{ fetchData() },[tab])

  async function fetchData(){
    setLoading(true); setError('')
    try{
      let res
      if (tab === 'interest') {
        res = isEntrepreneur ? await api.getReceivedInterests() : await api.getMyInterests()
      } else {
        res = tab==='received' ? await api.getReceivedRequests() : await api.getSentRequests()
      }
      setItems(res.data||[])
    }catch(e){ setError(e.message) } finally{ setLoading(false) }
  }

  async function act(id, action){
    if (acting) return
    setActing(id)
    try{
      if(action==='accept') await api.acceptRequest(id)
      if(action==='reject') await api.rejectRequest(id)
      if(action==='cancel') await api.cancelRequest(id)
    }catch(e){
      // Status already changed (e.g. double-click or another session acted) —
      // sync the row instead of showing a stale error
      if (!/already|Cannot cancel/i.test(e.message || '')) alert(e.message)
    }finally{
      setActing(null)
      fetchData()
    }
  }

  async function withdraw(id){
    try{ await api.withdrawInterest(id); fetchData() }catch(e){ alert(e.message) }
  }

  const showInterestTab = isEntrepreneur || isInvestor

  return (
    <div className="page-wrap">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-[#0057ff]">Requests</h1><p className="text-sm text-[#0057ff]">Manage collaboration requests sent & received.</p></div>
        <div className="flex rounded-xl border border-[#0057ff] overflow-hidden bg-white">
          <button onClick={()=>setTab('received')} className={`px-4 py-2 text-sm font-semibold ${tab==='received'?'bg-[#0057ff] text-white':'text-[#0057ff]'}`}>Received</button>
          <button onClick={()=>setTab('sent')} className={`px-4 py-2 text-sm font-semibold ${tab==='sent'?'bg-[#0057ff] text-white':'text-[#0057ff]'}`}>Sent</button>
          {showInterestTab && (
            <button onClick={()=>setTab('interest')} className={`px-4 py-2 text-sm font-semibold ${tab==='interest'?'bg-[#0057ff] text-white':'text-[#0057ff]'}`}>Interest</button>
          )}
        </div>
      </div>

      {loading ? <div className="py-16 text-center text-sm text-[#0057ff]">Loading…</div> :
        error ? <Card><div className="py-10 text-center text-sm text-[#0057ff]">{error}</div></Card> :
        items.length===0 ? <Card><div className="py-16 text-center flex flex-col items-center gap-2"><Inbox size={28} className="text-[#0057ff]"/><p className="text-sm text-[#0057ff]">{tab === 'interest' ? (isEntrepreneur ? 'No investor interest yet. Interest from investors will appear here.' : 'Startups you express interest in will appear here.') : `No ${tab} requests yet.`}</p></div></Card> :
        tab === 'interest' ? (
          <div className="grid gap-3">
            {items.map(i => (
              <Card key={i._id} className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#14B8A6] grid place-items-center text-white" style={{ flex: 'none' }}><Heart size={16} /></div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0057ff]">{isEntrepreneur ? (i.investor?.name || 'An investor') : (i.startup?.name || 'A startup')}</p>
                    <p className="text-xs text-[#0057ff] truncate max-w-[420px]">{i.message || 'Expressed interest'}</p>
                    <p className="text-xs text-[#0057ff] mt-1">{new Date(i.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success">interest</Badge>
                  {isInvestor && <Button size="sm" variant="secondary" onClick={() => withdraw(i._id)}>Withdraw</Button>}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-3">
          {items.map(r=> (
            <Card key={r._id} className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#0057ff] grid place-items-center text-sm font-bold">{(r.sender?.name||r.receiver?.name||'U').slice(0,2).toUpperCase()}</div>
                <div className="min-w-0"><p className="text-sm font-semibold text-[#0057ff]">{r.sender?.name} → {r.receiver?.name}</p><p className="text-xs text-[#0057ff] truncate max-w-[420px]">{r.message||'No message'}</p><p className="text-xs text-[#0057ff] mt-1">{new Date(r.createdAt).toLocaleString()}</p></div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={r.status==='pending'?'warning': r.status==='accepted'?'success':'danger'}>{r.status}</Badge>
                {tab==='received' && r.status==='pending' && (
                  <>
                    <Button size="sm" disabled={acting===r._id} onClick={()=>act(r._id,'accept')}><Check size={14}/> Accept</Button>
                    <Button size="sm" variant="danger" disabled={acting===r._id} onClick={()=>act(r._id,'reject')}><X size={14}/> Reject</Button>
                  </>
                )}
                {tab==='sent' && r.status==='pending' && <Button size="sm" variant="danger" disabled={acting===r._id} onClick={()=>act(r._id,'cancel')}><Clock size={14}/> Cancel</Button>}
              </div>
            </Card>
          ))}
        </div>
        )
      }
    </div>
  )
}
