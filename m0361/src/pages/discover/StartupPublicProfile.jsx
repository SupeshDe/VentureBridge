import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Building2, Download, FileText, MapPin } from 'lucide-react'
import api from '../../services/api'
import { Badge, Card } from '../../components/ui/Card'
import { Loading } from '../../components/common/Loading'
import ReportButton from '../../components/common/ReportButton'
import { ReviewsBlock } from '../../components/ui/StarRating'
import { formatLakhs } from '../../utils/format'

function StartupDocuments({ startupId }) {
  const [documents, setDocuments] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api.getStartupDocuments(startupId)
      .then(result => {
        if (active) setDocuments(result.data || [])
      })
      .catch(requestError => {
        if (active) {
          setError(requestError.message || 'Could not load startup documents.')
          setDocuments([])
        }
      })
    return () => { active = false }
  }, [startupId])

  if (documents === null) return <p className="text-sm text-[#0057ff]">Loading documents…</p>
  if (error) return <p className="text-sm text-[#0057ff]" role="alert">{error}</p>
  if (!documents.length) return <p className="text-sm text-[#0057ff]">No shared documents yet.</p>

  return (
    <div className="grid gap-2">
      {documents.map(document => (
        <a
          key={document.id}
          href={api.documentFileUrl(document.id)}
          download
          className="flex items-center gap-3 rounded-xl bg-[#f8f7f4] p-3 text-sm text-[#0057ff] no-underline"
        >
          <FileText size={16} />
          <span className="min-w-0 flex-1 truncate">{document.fileName}</span>
          <span className="text-xs">{(document.fileType || 'file').toUpperCase()}</span>
          <Download size={15} />
        </a>
      ))}
    </div>
  )
}

export default function StartupPublicProfile() {
  const { id } = useParams()
  const [startup, setStartup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setStartup(null)
    api.getStartup(id)
      .then(result => {
        if (active) setStartup(result.data)
      })
      .catch(requestError => {
        if (active) setError(requestError.message || 'Could not load this startup profile.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [id])

  if (loading) return <div className="page-wrap"><Loading /></div>
  if (error || !startup) {
    return (
      <div className="page-wrap">
        <Card>
          <p className="text-sm text-[#0057ff]" role="alert">{error || 'Startup profile not found.'}</p>
          <Link to="/discover/startups" className="text-sm font-semibold text-[#0057ff]">Back to startups</Link>
        </Card>
      </div>
    )
  }

  const ownerId = startup.owner?._id || startup.owner
  const facts = [
    ['Funding ask', formatLakhs(startup.fundingRequired?.amount)],
    ['Equity offered', startup.equityOffered != null ? `${startup.equityOffered}%` : '—'],
    ['Revenue', startup.revenue?.amount ? formatLakhs(startup.revenue.amount) : 'Pre-revenue'],
    ['Valuation', startup.valuation?.amount ? formatLakhs(startup.valuation.amount) : '—'],
    ['Team size', startup.teamSize ? `${startup.teamSize} people` : '—'],
    ['Founded', startup.foundedYear || '—'],
  ]

  return (
    <div className="page-wrap">
      <Link to="/discover/startups" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#0057ff] no-underline">
        <ArrowLeft size={16} /> Back to startups
      </Link>
      <Card className="grid gap-6">
        <header className="flex flex-wrap items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-[#0057ff] text-lg font-extrabold text-white">
            {(startup.name || 'ST').slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="m-0 text-2xl font-bold text-[#0057ff]">{startup.name}</h1>
              {startup.isVerified && <Badge variant="success">Verified</Badge>}
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-1 text-sm text-[#0057ff]">
              <MapPin size={14} />{startup.location || 'Location not provided'}
              {startup.industry && ` · ${startup.industry}`}
              {startup.startupStage && ` · ${startup.startupStage}`}
            </p>
          </div>
          <ReportButton reportedStartup={startup._id} />
        </header>

        {startup.tagline && <p className="m-0 text-lg font-semibold text-[#0057ff]">{startup.tagline}</p>}
        {startup.matchScore != null && (
          <Badge variant="success">{startup.matchScore}% match</Badge>
        )}

        <section>
          <h2 className="mb-2 text-base font-bold text-[#0057ff]">About the startup</h2>
          <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed text-[#0057ff]">{startup.description || 'No description provided.'}</p>
          {startup.explanation && <p className="mt-3 rounded-xl bg-[#f8f7f4] p-3 text-sm leading-relaxed text-[#0057ff]">{startup.explanation}</p>}
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-[#0057ff]">Funding and traction</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {facts.map(([label, value]) => (
              <div key={label} className="rounded-xl bg-[#f8f7f4] p-3">
                <p className="m-0 text-xs font-semibold uppercase tracking-wide text-[#0057ff] opacity-70">{label}</p>
                <p className="mb-0 mt-1 text-sm font-bold text-[#0057ff]">{value}</p>
              </div>
            ))}
          </div>
        </section>

        {(startup.businessModel || startup.targetMarket || startup.website) && (
          <section>
            <h2 className="mb-2 text-base font-bold text-[#0057ff]">Business</h2>
            {startup.businessModel && <p className="mb-2 text-sm leading-relaxed text-[#0057ff]"><strong>Model:</strong> {startup.businessModel}</p>}
            {startup.targetMarket && <p className="mb-2 text-sm leading-relaxed text-[#0057ff]"><strong>Target market:</strong> {startup.targetMarket}</p>}
            {startup.website && <a className="text-sm font-semibold text-[#0057ff]" href={startup.website} target="_blank" rel="noreferrer">{startup.website}</a>}
          </section>
        )}

        {(startup.tags || []).length > 0 && (
          <section>
            <h2 className="mb-2 text-base font-bold text-[#0057ff]">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {startup.tags.map(tag => <Badge key={tag} variant="muted">{tag}</Badge>)}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-2 flex items-center gap-2 text-base font-bold text-[#0057ff]"><Building2 size={16} /> Founder reviews</h2>
          <ReviewsBlock userId={ownerId} api={api} />
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-[#0057ff]">Diligence documents</h2>
          <StartupDocuments startupId={startup._id} />
        </section>
      </Card>
    </div>
  )
}
