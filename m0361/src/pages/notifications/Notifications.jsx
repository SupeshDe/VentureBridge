import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Bell, CheckCheck } from 'lucide-react'
import { formatRelative } from '../../utils/format'

export default function Notifications(){
  const [items,setItems]=useState([])
  const [loading,setLoading]=useState(true)
  useEffect(()=>{ (async()=>{ try{ const res=await api.getNotifications(); setItems(res.data||[]) } finally{ setLoading(false) } })() },[])

  async function markAll(){ try{ await api.markAllNotificationsAsRead(); setItems(items.map(i=>({...i,isRead:true})))}catch(e){ alert(e.message)} }
  async function markOne(id){ try{ await api.markNotificationAsRead(id); setItems(items.map(i=> i._id===id? {...i,isRead:true}:i))}catch(error){ alert(error instanceof Error ? error.message : 'Failed to mark notification as read') } }

  if(loading) return <div className="page-wrap"><div className="py-16 text-center text-sm text-[#0057ff]">Loading…</div></div>

  return (
    <div className="page-wrap">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#0057ff] flex items-center gap-2"><Bell size={22}/> Notifications</h1>
        <Button variant="secondary" size="sm" onClick={markAll}><CheckCheck size={14}/> Mark all read</Button>
      </div>
      {items.length===0 ? <Card><div className="py-16 text-center text-sm text-[#0057ff]">No notifications</div></Card> :
        <div className="grid gap-2">
          {items.map(n=> (
            <Card key={n._id} className={`flex gap-3 items-start ${n.isRead?'opacity-60':''}`}>
              <div className={`w-9 h-9 rounded-xl grid place-items-center ${n.isRead?'bg-[#0057ff] text-white':'bg-[#0057ff] text-white'}`}><Bell size={16}/></div>
              <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-[#0057ff]">{n.title}</p><p className="text-sm text-[#0057ff]">{n.message}</p><p className="text-xs text-[#0057ff] mt-1">{formatRelative(n.createdAt)}</p></div>
              {!n.isRead && <Button size="sm" variant="secondary" onClick={()=>markOne(n._id)}>Mark read</Button>}
            </Card>
          ))}
        </div>
      }
    </div>
  )
}
