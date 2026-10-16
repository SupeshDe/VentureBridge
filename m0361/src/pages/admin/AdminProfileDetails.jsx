import React, { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import api from '../../services/api'
import { Badge, Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Loading } from '../../components/common/Loading'

const TITLES = {
  user: 'User profile',
  startup: 'Startup profile',
  investor: 'Investor profile',
}

function labelFor(key) {
  const label = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, character => character.toUpperCase())
    .replace(/:+$/, '')
  return `${label}:`
}

function displayValue(value) {
  if (value == null || value === '') return 'Not provided'
  if (Array.isArray(value)) return value.length ? value.map(displayValue).join(', ') : 'Not provided'
  if (typeof value === 'object') {
    if (value instanceof Date) return value.toLocaleDateString()
    if (value.amount != null) {
      const amount = Number(value.amount).toLocaleString('en-IN')
      return `${value.currency === 'INR' || !value.currency ? '₹' : `${value.currency} `}${amount}`
    }
    return Object.entries(value)
      .filter(([key]) => !['_id', '__v'].includes(key))
      .map(([key, nested]) => `${labelFor(key)} ${displayValue(nested)}`)
      .join(' · ') || 'Not provided'
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  return String(value)
}

function ProfileSection({ title, data, omit = [], include = [] }) {
  const excludedFields = ['_id', '__v', 'createdAt', 'updatedAt', ...omit]
  const fields = Object.entries(data || {}).filter(([key, value]) =>
    (!excludedFields.includes(key) || include.includes(key)) &&
    value !== undefined
  )
  return (
    <Card>
      <h2 className="mb-4 text-lg font-bold text-[#0057ff]">{title}</h2>
      {fields.length ? (
        <dl className="flex flex-col gap-3">
          {fields.map(([key, value]) => (
            <div
              key={key}
              className="min-w-0"
              style={{
                display: 'grid',
                gridTemplateColumns: '160px minmax(0, 1fr)',
                columnGap: '16px',
                alignItems: 'baseline',
              }}
            >
              <dt className="text-sm font-semibold text-[#0057ff]">{labelFor(key)}</dt>
              <dd className="mb-0 break-words whitespace-pre-wrap text-sm text-[#0057ff]">{displayValue(value)}</dd>
            </div>
          ))}
        </dl>
      ) : <p className="m-0 text-sm text-[#0057ff]">No profile details available.</p>}
    </Card>
  )
}

export default function AdminProfileDetails() {
  const { type, id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const title = TITLES[type] || 'Profile details'
  const backPath = type === 'user' ? '/admin/users' : type === 'startup' ? '/admin/startups' : '/admin/investors'

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = type === 'user'
        ? await api.getUserDetails(id)
        : type === 'startup'
          ? await api.getStartup(id)
          : type === 'investor'
            ? await api.getInvestor(id)
            : null
      if (!response) throw new Error('Unknown profile type.')
      setData(response.data)
    } catch (loadError) {
      setError(loadError.message || 'Could not load profile details.')
    } finally {
      setLoading(false)
    }
  }, [id, type])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="page-wrap"><Loading label="Loading profile…" /></div>

  const user = type === 'user' ? data?.user : null
  const profile = type === 'user' ? data?.profile : data
  const profileSectionTitle = type === 'user'
    ? user?.role === 'entrepreneur'
      ? 'Entrepreneur Profile'
      : user?.role === 'investor'
        ? 'Investor Profile'
        : title
    : title
  const heading = type === 'user'
    ? user?.name || title
    : type === 'startup'
      ? profile?.name || title
      : profile?.organization || title

  return (
    <div className="page-wrap">
      <Link to={backPath} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#0057ff] no-underline">
        <ArrowLeft size={16} /> Back
      </Link>
      {error ? (
        <Card>
          <p className="mb-4 text-sm text-[#0057ff]" role="alert">{error}</p>
          <Button size="sm" onClick={load}>Retry</Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          <header className="flex flex-wrap items-center gap-3">
            <h1 className="m-0 text-2xl font-bold text-[#0057ff]">{heading}</h1>
            {profile?.isVerified != null && (
              <Badge variant={profile.isVerified ? 'success' : 'warning'}>
                {profile.isVerified ? 'Verified' : 'Unverified'}
              </Badge>
            )}
          </header>
          {user && <ProfileSection title="Account Information" data={user} omit={['password']} include={['createdAt', 'updatedAt']} />}
          {!user && profile?.owner && <ProfileSection title="Founder account" data={profile.owner} />}
          {!user && profile?.user && <ProfileSection title="Investor account" data={profile.user} />}
          {profile && <ProfileSection title={profileSectionTitle} data={profile} omit={['owner', 'user']} />}
          {!user && !profile && <Card><p className="m-0 text-sm text-[#0057ff]">Profile not found.</p></Card>}
        </div>
      )}
    </div>
  )
}
