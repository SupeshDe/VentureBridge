import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, Search, SearchX, Sparkles, MapPin, TrendingUp, X } from 'lucide-react'
import api from '../../services/api'
import { Card, Badge, IconTile } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Stars } from '../../components/ui/StarRating'
import { SkeletonCard } from '../../components/common/Loading'
import { useDebounce } from '../../hooks/useDebounce'
import { formatLakhs } from '../../utils/format'
import { INDUSTRIES } from '../../constants'

export default function DiscoverInvestors() {
  const [investors, setInvestors] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [industry, setIndustry] = useState('')
  const [minScore, setMinScore] = useState('')
  const [minRating, setMinRating] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [page, setPage] = useState(1)
  const [sentIds, setSentIds] = useState({})
  const [sentByUser, setSentByUser] = useState({})
  const [favouriteIds, setFavouriteIds] = useState({})
  const navigate = useNavigate()
  const debounced = useDebounce(query, 400)
  const hasFilters = Boolean(query || industry || minScore || minRating || sortBy)

  useEffect(() => { fetchData() }, [debounced, industry, minScore, minRating, sortBy, page])
  useEffect(() => {
    api.getSentRequests({ limit: 50 }).then(r => {
      const m = {}
      ;(r.data || []).forEach(req => {
        if (req.status === 'pending' || req.status === 'accepted') {
          m[String(req.receiver?._id || req.receiver)] = req.status
        }
      })
      setSentByUser(m)
    }).catch(() => {})
  }, [])
  useEffect(() => {
    api.getFavourites()
      .then(result => {
        const ids = {}
        ;(result.data || []).forEach(entry => {
          const id = entry.investorProfile?._id || entry.investorProfile
          if (id) ids[String(id)] = true
        })
        setFavouriteIds(ids)
      })
      .catch(error => console.error('Failed to load favourite investors:', error))
  }, [])

  const receiverId = inv => String(inv?.user?._id || inv?.user || '')
  function requestState(inv) {
    if (sentIds[inv._id]) return 'pending'
    return sentByUser[receiverId(inv)] || null
  }

  async function fetchData() {
    setLoading(true)
    setError('')
    try {
      const res = await api.getInvestors({ search: debounced || undefined, industry: industry || undefined, minScore: minScore || undefined, minRating: minRating || undefined, sort: sortBy || undefined, page, limit: 12 })
      setInvestors(res.data || [])
      setTotal(res.pagination?.total || 0)
    } catch (e) {
      console.error(e)
      setInvestors([])
      setTotal(0)
      setError(e.message || 'Could not load investor profiles.')
    } finally {
      setLoading(false)
    }
  }

  function clearFilters() {
    setQuery('')
    setIndustry('')
setMinScore('')
setMinRating('')
setSortBy('')
setPage(1)
}

  async function handleConnect(inv) {
    try {
      const me = await api.getMyStartup().catch(() => null)
      if (!me?.data) {
        alert('Create your startup profile first')
        return
      }
      await api.sendRequest({ receiver: inv.user?._id || inv.user, startup: me.data._id, message: 'Would love to connect' })
      setSentIds(s => ({ ...s, [inv._id]: true }))
    } catch (e) {
      if (e.message?.toLowerCase().includes('already')) setSentIds(s => ({ ...s, [inv._id]: true }))
      else alert(e.message)
    }
  }

  async function toggleFavourite(inv) {
    const id = String(inv._id)
    try {
      if (favouriteIds[id]) {
        await api.removeInvestorFavourite(id)
        setFavouriteIds(current => {
          const next = { ...current }
          delete next[id]
          return next
        })
      } else {
        await api.addInvestorFavourite(id)
        setFavouriteIds(current => ({ ...current, [id]: true }))
      }
    } catch (error) {
      alert(error.message)
    }
  }

  return (
    <div className="page-wrap">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0057ff] flex items-center gap-2">
          <Sparkles size={22} /> Discover investors
        </h1>
        <p className="text-sm text-[#0057ff]">Find investors aligned to your startup&apos;s stage, sector and raise.</p>
      </div>

      <Card className="mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[220px] flex items-center gap-2 rounded-xl border border-[#0057ff] px-3 py-2.5">
            <Search size={16} className="text-[#0057ff]" />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1) }}
              placeholder="Search by organization or bio"
              className="flex-1 outline-none text-sm"
              style={{ border: 0, background: 'transparent', color: '#0057ff' }}
            />
            {query && (
              <button onClick={() => { setQuery(''); setPage(1) }} aria-label="Clear search" style={{ background: 'none', border: 0, cursor: 'pointer', color: '#0057ff', display: 'grid', placeItems: 'center' }}>
                <X size={15} />
              </button>
            )}
          </div>
          <select
            value={industry}
            onChange={e => { setIndustry(e.target.value); setPage(1) }}
            className="rounded-xl border border-[#0057ff] px-3 py-2.5 text-sm bg-white"
            style={{ color: '#0057ff' }}
          >
            <option value="">All industries</option>
            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
          <select
            value={minScore}
            onChange={e => { setMinScore(e.target.value); setPage(1) }}
            className="rounded-xl border border-[#0057ff] px-3 py-2.5 text-sm bg-white"
            style={{ color: '#0057ff' }}
            title="Filter by match score against your startup profile"
          >
            <option value="">Any fit score</option>
            <option value="50">50%+ fit</option>
            <option value="70">70%+ fit</option>
<option value="85">85%+ fit</option>
</select>
<select
value={minRating}
onChange={e => { setMinRating(e.target.value); setPage(1) }}
className="rounded-xl border border-[#0057ff] px-3 py-2.5 text-sm bg-white"
style={{ color: '#0057ff' }}
title="Filter by investor rating"
>
<option value="">Any rating</option>
<option value="3">3★+ rated</option>
<option value="4">4★+ rated</option>
<option value="4.5">4.5★+ rated</option>
</select>
<select
value={sortBy}
onChange={e => { setSortBy(e.target.value); setPage(1) }}
className="rounded-xl border border-[#0057ff] px-3 py-2.5 text-sm bg-white"
style={{ color: '#0057ff' }}
title="Sort results"
>
<option value="">Sort: newest</option>
<option value="-matchScore">Sort: best fit</option>
<option value="-rating">Sort: top rated</option>
</select>
          {hasFilters && !loading && (
            <Button size="sm" variant="secondary" onClick={clearFilters}>Clear{total > 0 ? ` (${total})` : ''}</Button>
          )}
        </div>
      </Card>

      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <Card>
          <div className="py-12 text-center">
            <p className="mb-4 text-sm text-[#0057ff]" role="alert">{error}</p>
            <Button size="sm" onClick={fetchData}>Retry</Button>
          </div>
        </Card>
      ) : investors.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center text-center py-14 px-6 gap-3">
            <IconTile icon={SearchX} />
            <h3 className="text-base font-bold text-[#0057ff]">
              {hasFilters ? 'No investors match those filters' : 'No investor profiles yet'}
            </h3>
            <p className="text-sm text-[#0057ff] max-w-md" style={{ opacity: .75 }}>
              {hasFilters
                ? 'Try widening the industry or clearing your search.'
                : 'Investor profiles will appear here once investors complete their profiles. Profiles are marked as verified after admin approval.'}
            </p>
            <div className="flex gap-2 mt-2 flex-wrap justify-center">
              {hasFilters && <Button size="sm" onClick={clearFilters}>Clear filters</Button>}
              <Link to="/startup/profile" style={{ textDecoration: 'none' }}>
                <Button size="sm" variant="secondary">Complete startup profile</Button>
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {investors.map(inv => {
              const state = requestState(inv)
              const sent = state === 'pending'
              const connected = state === 'accepted'
              return (
                <Card key={inv._id} className="discover-profile-card flex flex-col">
                  <div className="flex gap-3">
                    <div className="w-11 h-11 rounded-full bg-[#0057ff] text-white grid place-items-center font-bold text-xs" style={{ flex: 'none' }}>
                      {inv.organization?.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-[#0057ff] truncate">{inv.organization} {inv.isVerified ? <Badge variant="success">Verified</Badge> : <Badge variant="warning">Unverified</Badge>} {inv.matchScore != null && <Badge variant="success" title={inv.explanation}>{inv.matchScore}% fit</Badge>} {inv.rating?.count > 0 && <Stars value={inv.rating.avg} count={inv.rating.count} />}</h3>
                      <p className="text-xs text-[#0057ff] flex items-center gap-1">
                        <MapPin size={12} />{inv.location || '—'} · {inv.investmentType || 'Equity'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleFavourite(inv)}
                      aria-label={favouriteIds[String(inv._id)] ? `Remove ${inv.organization} from favourites` : `Add ${inv.organization} to favourites`}
                      title={favouriteIds[String(inv._id)] ? 'Remove from favourites' : 'Add to favourites'}
                      className="grid h-9 w-9 place-items-center rounded-full"
                      style={{
                        color: favouriteIds[String(inv._id)] ? '#ec4899' : '#0057ff',
                        backgroundColor: favouriteIds[String(inv._id)] ? '#fce7f3' : 'transparent',
                      }}
                    >
                      <Heart
                        size={17}
                        color={favouriteIds[String(inv._id)] ? '#ec4899' : '#0057ff'}
                        fill={favouriteIds[String(inv._id)] ? '#ec4899' : 'none'}
                        strokeWidth={2.4}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-[#0057ff] mt-3 line-clamp-3 min-h-[48px]">{inv.bio || 'No bio yet.'}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                    {(inv.preferredIndustries || []).slice(0, 3).map(t => (
                      <span key={t} style={{ fontSize: 12, fontWeight: 600, color: '#0057ff', background: '#f8f7f4', border: '1px solid #f8f7f4', borderRadius: 999, padding: '4px 11px' }}>{t}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-xs text-[#0057ff]">
                    <TrendingUp size={12} />{formatLakhs(inv.investmentRange?.minimum)} – {formatLakhs(inv.investmentRange?.maximum)}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" disabled={sent || connected} onClick={() => handleConnect(inv)}>
                      {connected ? 'Connected ✓' : sent ? 'Requested ✓' : 'Connect'}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/investors/${inv._id}`)}>View profile</Button>
                  </div>
                </Card>
              )
            })}
          </div>
          <div className="flex items-center justify-between flex-wrap gap-3 mt-6 text-sm">
            <span className="text-[#0057ff]">{total} investor{total === 1 ? '' : 's'}</span>
            <div className="flex gap-2 items-center">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              <span className="px-3 py-1 text-sm font-medium text-[#0057ff]">Page {page}</span>
              <Button variant="secondary" size="sm" disabled={investors.length < 12} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        </>
      )}


    </div>
  )
}
