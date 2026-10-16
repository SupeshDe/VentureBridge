import React, { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell, BriefcaseBusiness, Building2, Compass, FileText, Heart,
  LayoutDashboard, LogOut, Menu, MessageCircle, Settings, ShieldCheck, Users, X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { BotAvatar } from '../components/ui/BotAvatar'
import AiAssistant from '../components/common/AiAssistant'
import logoUrl from '../assets/logo-128.webp'
import './console.css'

const RAILS = {
  entrepreneur: [
    ['Dashboard', LayoutDashboard, '/dashboard'],
    ['Discover', Compass, '/discover/investors'],
    ['Startup', Building2, '/startup/profile'],
    ['Requests', Users, '/requests'],
    ['Messages', MessageCircle, '/messages'],
    ['Docs', FileText, '/documents'],
  ],
  investor: [
    ['Dashboard', LayoutDashboard, '/dashboard'],
    ['Discover', Compass, '/discover/startups'],
    ['Profile', Users, '/investor/profile'],
    ['Requests', Users, '/requests'],
    ['Messages', MessageCircle, '/messages'],
    ['Saved', Heart, '/favourites'],
  ],
  admin: [
    ['Overview', LayoutDashboard, '/admin/dashboard'],
    ['Verification', ShieldCheck, '/admin/verification'],
    ['Users', Users, '/admin/users'],
    ['Startups', Building2, '/admin/startups'],
    ['Investors', BriefcaseBusiness, '/admin/investors'],
    ['Industries', Compass, '/admin/industries'],
    ['Content', FileText, '/admin/content'],
    ['Reports', FileText, '/admin/reports'],
  ],
}

const TITLES = {
  dashboard: 'Overview', discover: 'Discover', startup: 'My startup',
  investor: 'Investor profile', requests: 'Requests', connections: 'Connections',
  messages: 'Messages', notifications: 'Notifications', documents: 'Documents',
  settings: 'Settings', favourites: 'Favourites', admin: 'Admin',
  users: 'Users', startups: 'Startups', investors: 'Investors', industries: 'Industries', content: 'Content', reports: 'Reports', verification: 'Verification', profiles: 'Profile details',
}

function titleFor(pathname) {
  const seg = pathname.split('/').filter(Boolean)
  if (seg[0] === 'admin') return TITLES[seg[1]] || 'Admin'
  return TITLES[seg[0]] || 'Workspace'
}

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [pendingRequestCount, setPendingRequestCount] = useState(0)
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    fetchUnreadCount()
    fetchPendingRequestCount()
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const response = await api.getUnreadCount()
      setUnreadCount(response.data.unreadCount)
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  }

  const fetchPendingRequestCount = async () => {
    try {
      const response = await api.getPendingRequestCount()
      setPendingRequestCount(response.data.pendingCount)
    } catch (error) {
      console.error('Failed to fetch pending request count:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      navigate('/', { replace: true })
    }
  }

  const getNavGroups = () => {
    if (user?.role === 'entrepreneur') {
      return [
        {
          label: 'Workspace',
          items: [
            ['Dashboard', LayoutDashboard, '/dashboard'],
            ['Discover investors', Compass, '/discover/investors'],
            ['My startup', Building2, '/startup/profile'],
            ['Requests', Users, '/requests'],
          ],
        },
        {
          label: 'Connect',
          items: [
            ['Connections', BriefcaseBusiness, '/connections'],
            ['Messages', MessageCircle, '/messages'],
            ['Favourites', Heart, '/favourites'],
          ],
        },
        {
          label: 'Manage',
          items: [
            ['Documents', FileText, '/documents'],
            ['Settings', Settings, '/settings'],
          ],
        },
      ]
    } else if (user?.role === 'investor') {
      return [
        {
          label: 'Workspace',
          items: [
            ['Dashboard', LayoutDashboard, '/dashboard'],
            ['Discover startups', Compass, '/discover/startups'],
            ['My profile', Users, '/investor/profile'],
            ['Requests', Users, '/requests'],
          ],
        },
        {
          label: 'Connect',
          items: [
            ['Connections', BriefcaseBusiness, '/connections'],
            ['Messages', MessageCircle, '/messages'],
            ['Favourites', Heart, '/favourites'],
          ],
        },
        {
          label: 'Manage',
          items: [
            ['Settings', Settings, '/settings'],
          ],
        },
      ]
    } else if (user?.role === 'admin') {
      return [
        {
          label: 'Admin Panel',
          items: [
            ['Overview', LayoutDashboard, '/admin/dashboard'],
            ['Verification', ShieldCheck, '/admin/verification'],
            ['Users', Users, '/admin/users'],
            ['Startups', Building2, '/admin/startups'],
            ['Investors', BriefcaseBusiness, '/admin/investors'],
            ['Industries', Compass, '/admin/industries'],
            ['Content', FileText, '/admin/content'],
            ['Reports', FileText, '/admin/reports'],
          ],
        },
      ]
    }
    return []
  }

  const rail = RAILS[user?.role] || RAILS.entrepreneur
  const navGroups = getNavGroups()
  const currentPath = location.pathname
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'
  const avatarSeed = user?._id || user?.email || 'user'

  return (
    <div className="console">
      <aside className="console-rail" aria-label="App">
        <Link to="/dashboard" className="console-rail-logo-wrap" title="VentureBridge" aria-label="Home">
          <img src={logoUrl} alt="VentureBridge" className="console-rail-logo-img" width="28" height="28" decoding="async" />
        </Link>
        <Link className="console-rail-avatar" to="/settings" title={user?.name}><BotAvatar seed={avatarSeed} size={30} alt={user?.name || 'User avatar'} /></Link>
        {rail.map(([label, Icon, path]) => (
          <Link key={label} to={path} title={label} className={currentPath === path ? 'on' : ''}>
            <Icon size={19} />
          </Link>
        ))}
        <span className="sp" />
        <Link to="/settings" title="Settings" className={currentPath === '/settings' ? 'on' : ''}>
          <Settings size={19} />
        </Link>
        <button onClick={handleLogout} title="Sign out"><LogOut size={19} /></button>
      </aside>

      <aside className={`console-nav ${mobileOpen ? 'open' : ''}`} aria-label="Workspace">
        <Link className="console-brand" to="/dashboard" onClick={() => setMobileOpen(false)}>
          <img src={logoUrl} alt="VentureBridge" className="console-brand-logo" width="26" height="26" decoding="async" />venturebridge
        </Link>
        {navGroups.map(group => (
          <div className="console-sec" key={group.label}>
            <small>{group.label}</small>
            {group.items.map(([label, Icon, path]) => (
              <Link
                key={label}
                to={path}
                className={currentPath === path ? 'on' : ''}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={17} />
                <span>{label}</span>
                {label === 'Requests' && pendingRequestCount > 0 && (
                  <span className="ct">{pendingRequestCount}</span>
                )}
              </Link>
            ))}
          </div>
        ))}
        <div className="console-user">
          <b>{user?.name}</b>
          <span style={{ textTransform: 'capitalize' }}>{user?.role}</span>
          <button onClick={handleLogout}><LogOut size={14} /> Sign out</button>
        </div>
      </aside>

      {mobileOpen && <div className="console-overlay" onClick={() => setMobileOpen(false)} />}

      <div className="console-body">
        <header className="console-head">
          <button className="console-burger" onClick={() => setMobileOpen(o => !o)} aria-label="Menu">
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <h2>{titleFor(currentPath)}</h2>
          <div className="row">
            <Link to="/notifications" className="console-bell" title="Notifications">
              <Bell size={17} />
              {unreadCount > 0 && <i className="dot" />}
            </Link>
            <div className="console-who">
              <span className="av"><BotAvatar seed={avatarSeed} size={24} alt="" /></span>
              <span>{user?.name}</span>
            </div>
          </div>
        </header>

        <main className="console-main">
          <Outlet />
        </main>
      </div>
      {(user?.role === 'entrepreneur' || user?.role === 'investor') && <AiAssistant />}
    </div>
  )
}
