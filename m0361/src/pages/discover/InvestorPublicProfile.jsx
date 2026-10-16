import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin } from 'lucide-react'
import api from '../../services/api'
import { Badge, Card } from '../../components/ui/Card'
import { Loading } from '../../components/common/Loading'
import ReportButton from '../../components/common/ReportButton'
import { ReviewsBlock } from '../../components/ui/StarRating'
import { formatLakhs } from '../../utils/format'

export default function InvestorPublicProfile() {
  const { id } = useParams()
  const [investor, setInvestor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setInvestor(null)
    api.getInvestor(id)
      .then(result => {
        if (active) setInvestor(result.data)
      })
      .catch(requestError => {
        if (active) setError(requestError.message || 'Could not load this investor profile.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [id])

  if (loading) return <div className="page-wrap"><Loading /></div>
  if (error || !investor) {
    return (
      <div className="page-wrap">
        <Card>
          <p className="text-sm text-[#0057ff]" role="alert">{error || 'Investor profile not found.'}</p>
          <Link to="/discover/investors" className="text-sm font-semibold text-[#0057ff]">Back to investors</Link>
        </Card>
      </div>
    )
  }

  const userId = investor.user?._id || investor.user
  const facts = [
    ['Location', investor.location || '—'],
    ['Investment type', investor.investmentType || 'Equity'],
    ['Cheque range', `${formatLakhs(investor.investmentRange?.minimum)} – ${formatLakhs(investor.investmentRange?.maximum)}`],
    ['Risk appetite', investor.riskPreference || '—'],
    ['Preferred stages', (investor.preferredStages || []).join(', ') || '—'],
    ['Preferred locations', (investor.preferredLocations || []).join(', ') || '—'],
  ]

  return (
    <div className="page-wrap">
      <Link to="/discover/investors" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#0057ff] no-underline">
        <ArrowLeft size={16} /> Back to investors
      </Link>
      <Card className="grid gap-6">
        <header className="flex flex-wrap items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-[#0057ff] text-lg font-extrabold text-white">
            {(investor.organization || 'IN').slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="m-0 text-2xl font-bold text-[#0057ff]">{investor.organization}</h1>
              {(investor.isVerified || investor.user?.isVerified) && <Badge variant="success">Verified</Badge>}
              {investor.matchScore != null && <Badge variant="success">{investor.matchScore}% match</Badge>}
            </div>
            <p className="mt-1 flex items-center gap-1 text-sm text-[#0057ff]">
              <MapPin size={14} />{investor.location || 'Location not provided'}
            </p>
          </div>
          <ReportButton reportedUser={userId} />
        </header>

        <section>
          <h2 className="mb-2 text-base font-bold text-[#0057ff]">Investment thesis</h2>
          <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed text-[#0057ff]">{investor.bio || 'No investment thesis provided.'}</p>
        </section>

        {(investor.preferredIndustries || []).length > 0 && (
          <section>
            <h2 className="mb-2 text-base font-bold text-[#0057ff]">Focus areas</h2>
            <div className="flex flex-wrap gap-2">
              {investor.preferredIndustries.map(industry => <Badge key={industry} variant="muted">{industry}</Badge>)}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-3 text-base font-bold text-[#0057ff]">Investment details</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {facts.map(([label, value]) => (
              <div key={label} className="rounded-xl bg-[#f8f7f4] p-3">
                <p className="m-0 text-xs font-semibold uppercase tracking-wide text-[#0057ff] opacity-70">{label}</p>
                <p className="mb-0 mt-1 text-sm font-bold text-[#0057ff]">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-[#0057ff]">Investor reviews</h2>
          <ReviewsBlock userId={userId} api={api} />
        </section>
      </Card>
    </div>
  )
}
