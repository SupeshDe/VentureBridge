import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { LogOut, ShieldCheck, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Settings(){
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  async function handleLogout(){ try { await logout() } finally { navigate('/', { replace: true }) } }
  return (
    <div className="page-wrap max-w-3xl">
      <h1 className="text-2xl font-bold text-[#0057ff] mb-4">Settings</h1>
      <Card className="mb-4">
        <div className="flex gap-4 items-center">
          <div className="w-14 h-14 rounded-full bg-[#0057ff] text-white grid place-items-center font-bold" style={{ flex: 'none', boxShadow: 'inset 0 0 0 2px rgba(248,247,244,.35), 0 10px 22px -10px rgba(0,87,255,.55)' }}>{user?.name?.slice(0,2).toUpperCase()}</div>
          <div className="min-w-0"><p className="font-semibold text-[#0057ff] truncate">{user?.name}</p><p className="text-sm text-[#0057ff]" style={{ overflowWrap: 'anywhere' }}>{user?.email} · {user?.role}</p></div>
          <span className="ml-auto inline-flex items-center gap-1 text-xs text-[#0057ff] bg-[#f8f7f4] px-2 py-1 rounded-full" style={{ flex: 'none' }}><ShieldCheck size={12}/> Secure</span>
        </div>
      </Card>
      <Card>
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><User size={16}/> Account</h3>
        <div className="grid gap-3 text-sm text-[#0057ff]">
          <p>Role: <strong className="text-[#0057ff]">{user?.role}</strong></p>
          <p>Verified: <strong className="text-[#0057ff]">{user?.isVerified? 'Yes':'No'}</strong></p>
          <p className="text-xs bg-[#f8f7f4] border border-[#0057ff] rounded-xl p-3">Enterprise security: JWT over httpOnly cookies, rate limiting, Helmet headers, mongo sanitize & HPP protection enabled.</p>
        </div>
        <div className="mt-6"><Button variant="danger" onClick={handleLogout}><LogOut size={16}/> Sign out</Button></div>
      </Card>
    </div>
  )
}
