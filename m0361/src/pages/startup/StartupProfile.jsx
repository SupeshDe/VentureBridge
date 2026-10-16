import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Building2, Save, Trash2, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react'
import api from '../../services/api'
import { ReviewsBlock } from '../../components/ui/StarRating'
import { INDUSTRIES, STAGES, RISK_LEVELS } from '../../constants'
import { Card, Badge } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { formatLakhs } from '../../utils/format'

const inputCls = 'w-full rounded-xl border border-[#0057ff] px-3 py-2.5 text-sm focus:outline-none'
const labelCls = 'block text-sm font-bold text-[#0057ff] mb-1.5'
const helpCls = 'block text-xs text-[#0057ff] mt-1.5 leading-relaxed'
const errCls = 'block text-xs font-semibold text-[#0057ff] mt-1.5'

function Field({ label, htmlFor, required, help, error, children }) {
  return (
    <div className="min-w-0">
      <label className={labelCls} htmlFor={htmlFor}>
        {label} {required && <span aria-hidden="true">*</span>}
      </label>
      {children}
      {help && !error && <small className={helpCls}>{help}</small>}
      {error && <span className={errCls} role="alert">! {error}</span>}
    </div>
  )
}

function Section({ step, title, hint, children }) {
  return (
    <section style={{ borderTop: '1px solid #0057ff', paddingTop: 20 }}>
      <p className="text-xs font-bold text-[#0057ff] uppercase tracking-widest mb-1">Step {step}</p>
      <h2 className="text-base font-bold text-[#0057ff] mb-1">{title}</h2>
      <p className="text-sm text-[#0057ff] mb-4" style={{ opacity: .75 }}>{hint}</p>
      {children}
    </section>
  )
}

function SingleChips({ options, value, onPick }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => {
        const on = value === o
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onPick(on ? '' : o)}
            className="text-xs font-semibold rounded-full px-3.5 py-2 transition"
            style={{
              border: '1px solid #0057ff',
              background: on ? '#0057ff' : '#f8f7f4',
              color: on ? '#f8f7f4' : '#0057ff',
              cursor: 'pointer',
            }}
          >
            {on ? '✓ ' : ''}{o}
          </button>
        )
      })}
    </div>
  )
}

function AiAnalysis({ startupId }) {
  const [a, setA] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let live = true
    api.getStartupAnalysis(startupId).then(r => { if (live) setA(r.data) }).catch(() => {}).finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [startupId])
  if (loading) return <Card><div className="py-6 text-center text-sm text-[#0057ff]">Analysing profile…</div></Card>
  if (!a) return null
  const List = ({ title, items, color }) => (
    <div className="min-w-0">
      <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color }}>{title}</p>
      <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }} className="text-sm text-[#0057ff]">
        {items.map((t, i) => <li key={i}>{t}</li>)}
      </ul>
    </div>
  )
  return (
    <Card className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={16} className="text-[#0057ff]" />
        <h2 className="text-base font-bold text-[#0057ff]">Profile insights</h2>
        <span className="text-xs text-[#0057ff]" style={{ opacity: .6 }}>rule-based, no AI vendor involved</span>
        <span className="ml-auto text-sm font-bold text-[#0057ff]">{a.completeness}% complete</span>
      </div>
      <div style={{ height: 6, background: 'rgba(0,87,255,.14)', marginBottom: 12 }}>
        <div style={{ height: '100%', width: `${a.completeness}%`, background: '#0057ff' }} />
      </div>
      <p className="text-sm text-[#0057ff] mb-4" style={{ lineHeight: 1.65 }}>{a.summary}</p>
      <div className="grid md:grid-cols-3 gap-5">
        <List title="Strengths" items={a.strengths} color="#14B8A6" />
        <List title="Gaps to fix" items={a.gaps} color="#F5B82E" />
        <List title="Risks" items={a.risks} color="#FF6B6B" />
      </div>
      <p className="text-xs text-[#0057ff] mt-4" style={{ opacity: .6 }}>{a.disclaimer}</p>
    </Card>
  )
}

export default function StartupProfile() {
  const { user } = useAuth()
  const [startup, setStartup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [details, setDetails] = useState([])
  const [success, setSuccess] = useState('')

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { industry: '', startupStage: '', riskPreference: '' },
  })

  const industry = watch('industry')
  const stage = watch('startupStage')
  const amountWatch = watch('fundingAmount')

  useEffect(() => { fetchStartup() }, [])

  async function fetchStartup() {
    try {
      const res = await api.getMyStartup()
      if (!res.data) {
        setStartup(null)
        return
      }
      setStartup(res.data)
      reset({
        name: res.data.name || '',
        tagline: res.data.tagline || '',
        description: res.data.description || '',
        location: res.data.location || '',
        website: res.data.website || '',
        industry: res.data.industry && !INDUSTRIES.includes(res.data.industry)
          ? 'Other'
          : res.data.industry || '',
        customIndustry: res.data.industry && !INDUSTRIES.includes(res.data.industry)
          ? res.data.industry
          : '',
        startupStage: res.data.startupStage || '',
        riskPreference: res.data.riskPreference || '',
        businessModel: res.data.businessModel || '',
        targetMarket: res.data.targetMarket || '',
        fundingAmount: res.data.fundingRequired?.amount ?? '',
        revenueAmount: res.data.revenue?.amount ?? '',
        valuationAmount: res.data.valuation?.amount ?? '',
        equityOffered: res.data.equityOffered ?? '',
        teamSize: res.data.teamSize ?? '',
        foundedYear: res.data.foundedYear ?? '',
        tags: (res.data.tags || []).join(', '),
        pitchDeckUrl: res.data.pitchDeckUrl || '',
      })
    } catch (e) {
      if (e.message !== 'You have not created a startup profile yet') {
        setError(e.message)
        setDetails(e.details || [])
      }
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async data => {
    setSaving(true); setError(''); setDetails([]); setSuccess('')
    try {
      const num = v => (v === '' || v == null ? undefined : Number(v))
      const payload = {
        ...data,
        industry: data.industry === 'Other' ? data.customIndustry?.trim() : data.industry,
        fundingRequired: { amount: Number(data.fundingAmount) || 0, currency: 'INR' },
        revenue: data.revenueAmount ? { amount: Number(data.revenueAmount), currency: 'INR' } : undefined,
        valuation: data.valuationAmount ? { amount: Number(data.valuationAmount), currency: 'INR' } : undefined,
        equityOffered: data.equityOffered === '' ? 0 : Number(data.equityOffered),
        teamSize: num(data.teamSize),
        foundedYear: num(data.foundedYear),
        tags: String(data.tags || '').split(',').map(t => t.trim()).filter(Boolean).slice(0, 12),
      }
      delete payload.fundingAmount
      delete payload.revenueAmount
      delete payload.valuationAmount
      const res = startup ? await api.updateStartup(payload) : await api.createStartup(payload)
      setStartup(res.data)
      setSuccess(startup ? 'Profile updated successfully.' : 'Profile created successfully.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      setError(e.message || 'Could not save — please check the highlighted fields.')
      setDetails(e.details || [])
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete your startup profile? This cannot be undone.')) return
    try {
      await api.request('/startups/me/profile', { method: 'DELETE' })
      setStartup(null)
      reset({ industry: '', startupStage: '', riskPreference: '' })
      setSuccess('Profile deleted.')
    } catch (e) {
      setError(e.message)
      setDetails(e.details || [])
    }
  }

  if (loading) return <div className="page-wrap"><div className="py-16 text-center text-[#0057ff]">Loading…</div></div>

  return (
    <div className="page-wrap">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#0057ff] grid place-items-center text-white" style={{ flex: 'none' }}>
          <Building2 size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#0057ff]">{startup ? 'Manage startup profile' : 'Create startup profile'}</h1>
          <p className="text-sm text-[#0057ff]">Your startup is how investors discover you. Keep it accurate and compelling.</p>
        </div>
        {startup?.isVerified && <Badge variant="success">Verified</Badge>}
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-[#f8f7f4] border border-[#0057ff] text-sm text-[#0057ff]" role="alert">
          <p className="flex items-center gap-2 font-bold mb-1"><AlertCircle size={16} />{error}</p>
          {details.length > 0 && (
            <ul style={{ margin: '8px 0 0', paddingLeft: 22, display: 'grid', gap: 4 }}>
              {details.map((d, i) => <li key={i}>{typeof d === 'string' ? d : d.message || JSON.stringify(d)}</li>)}
            </ul>
          )}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-xl bg-[#0057ff] text-sm text-white flex items-center gap-2">
          <CheckCircle2 size={16} />{success}
        </div>
      )}

      {startup && <AiAnalysis startupId={startup._id} />}
      {startup && (
        <Card className="mb-4">
          <h2 className="text-base font-bold text-[#0057ff] mb-2">What connections say</h2>
          <ReviewsBlock userId={user?._id || user?.id} api={api} />
        </Card>
      )}

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-7">
          <Section step="1" title="The basics" hint="The name and one-liner founders see first in search and shortlists.">
            <div className="grid md:grid-cols-2 gap-5">
              <Field label="Startup name" htmlFor="sp-name" required error={errors.name?.message}>
                <input
                  id="sp-name"
                  className={inputCls}
                  placeholder="e.g. AeroPay"
                  {...register('name', { required: 'Give your startup a name.', minLength: { value: 2, message: 'At least 2 characters.' } })}
                />
              </Field>
              <Field label="Based in" htmlFor="sp-loc" help="City (and country). Used for the 10% location part of your match score.">
                <input id="sp-loc" className={inputCls} placeholder="e.g. Bengaluru, India" {...register('location')} />
              </Field>
            </div>
            <div style={{ marginTop: 20 }}>
              <Field
                label="What do you do?"
                htmlFor="sp-desc"
                help="What problem you solve, who pays, and any traction (revenue, users, pilots). This is your 30-second pitch in text."
                error={errors.description?.message}
              >
                <textarea
                  id="sp-desc"
                  className={inputCls}
                  rows={4}
                  placeholder="e.g. AeroPay helps logistics fleets collect freight payments 3× faster. ₹12L ARR across 40 fleets, growing 20% MoM."
                  {...register('description', { maxLength: { value: 5000, message: 'Keep it under 5000 characters.' } })}
                />
              </Field>
            </div>
          </Section>

          <Section step="2" title="Where do you fit?" hint="Tap one per row. Industry match alone decides 30% of every score.">
            <div className="grid gap-5">
              <Field label={`Industry${industry ? `: ${industry}` : ''}`} htmlFor="sp-ind">
                <span id="sp-ind" />
                <SingleChips options={INDUSTRIES} value={industry} onPick={v => setValue('industry', v)} />
                {industry === 'Other' && (
                  <input
                    id="sp-custom-industry"
                    className={inputCls}
                    style={{ marginTop: 12 }}
                    placeholder="Type your industry"
                    {...register('customIndustry', {
                      validate: value => industry !== 'Other' || Boolean(value?.trim()) || 'Enter your industry.',
                    })}
                  />
                )}
                {industry === 'Other' && errors.customIndustry && (
                  <span className={errCls} role="alert">! {errors.customIndustry.message}</span>
                )}
              </Field>
              <Field label={`Stage${stage ? `: ${stage}` : ''}`} htmlFor="sp-stage">
                <span id="sp-stage" />
                <SingleChips options={STAGES} value={stage} onPick={v => setValue('startupStage', v)} />
              </Field>
              <Field label="Risk profile" htmlFor="sp-risk" help="How would an investor describe your journey — steady, balanced, or moonshot?">
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Risk profile">
                  {RISK_LEVELS.map(r => (
                    <label key={r} className="text-xs font-semibold rounded-full px-3.5 py-2 transition" style={{
                      border: '1px solid #0057ff', cursor: 'pointer',
                      background: watch('riskPreference') === r ? '#0057ff' : '#f8f7f4',
                      color: watch('riskPreference') === r ? '#f8f7f4' : '#0057ff',
                    }}>
                      <input type="radio" value={r} {...register('riskPreference')} style={{ position: 'absolute', opacity: 0 }} />
                      {r}
                    </label>
                  ))}
                </div>
              </Field>
            </div>
          </Section>

          <Section step="3" title="The ask" hint="Investors filter by these numbers first. Amounts are in rupees — the lakh value previews as you type.">
            <div className="grid md:grid-cols-2 gap-5">
              <Field
                label="Funding needed (₹)"
                htmlFor="sp-amt"
                required
                help={amountWatch ? `≈ ${formatLakhs(Number(amountWatch) || 0)}` : 'e.g. 5000000 for ₹50L'}
                error={errors.fundingAmount?.message}
              >
                <input
                  id="sp-amt"
                  type="number"
                  min="0"
                  className={inputCls}
                  placeholder="e.g. 5000000"
                  {...register('fundingAmount', {
                    required: 'Enter how much you want to raise.',
                    validate: v => Number(v) > 0 || 'Must be more than zero.',
                  })}
                />
              </Field>
              <Field label="Equity you offer (%)" htmlFor="sp-eq" help="What share of the company this round buys. Optional — leave blank if undecided.">
                <input
                  id="sp-eq"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  className={inputCls}
                  placeholder="e.g. 10"
                  {...register('equityOffered', { min: { value: 0, message: '0–100 only.' }, max: { value: 100, message: '0–100 only.' } })}
                />
                {errors.equityOffered && <span className={errCls} role="alert">! {errors.equityOffered.message}</span>}
              </Field>
            </div>
          </Section>

          <Section step="4" title="Business & traction" hint="The diligence block. Complete profiles convert more intros — each field feeds your match score or the AI analysis.">
            <div className="grid md:grid-cols-2 gap-5">
              <Field label="Tagline" htmlFor="sp-tag" help="One line under your name in search results.">
                <input id="sp-tag" className={inputCls} maxLength={160} placeholder="e.g. Freight payments, 3× faster" {...register('tagline')} />
              </Field>
              <Field label="Website" htmlFor="sp-web">
                <input id="sp-web" className={inputCls} placeholder="https://…" {...register('website')} />
              </Field>
              <Field label="Annual revenue (₹)" htmlFor="sp-rev" help="Current ARR or last-year revenue. Enter 0 or leave blank if pre-revenue.">
                <input id="sp-rev" type="number" min="0" className={inputCls} placeholder="e.g. 1200000" {...register('revenueAmount')} />
              </Field>
              <Field label="Valuation (₹)" htmlFor="sp-val" help="Post-money expectation for this round.">
                <input id="sp-val" type="number" min="0" className={inputCls} placeholder="e.g. 80000000" {...register('valuationAmount')} />
              </Field>
              <Field label="Team size" htmlFor="sp-team">
                <input id="sp-team" type="number" min="1" max="100000" className={inputCls} placeholder="e.g. 6" {...register('teamSize')} />
              </Field>
              <Field label="Founded year" htmlFor="sp-year">
                <input id="sp-year" type="number" min="1980" max="2100" className={inputCls} placeholder="e.g. 2023" {...register('foundedYear')} />
              </Field>
            </div>
            <div style={{ marginTop: 20 }}>
              <Field label="Business model" htmlFor="sp-bm" help="How you make money — pricing, margins, sales motion.">
                <textarea id="sp-bm" className={inputCls} rows={3} placeholder="e.g. SaaS at ₹8,000/fleet/month + 1% collection fee." {...register('businessModel')} />
              </Field>
            </div>
            <div style={{ marginTop: 20 }}>
              <Field label="Target market" htmlFor="sp-tm" help="Who buys, how many of them exist, and where.">
                <textarea id="sp-tm" className={inputCls} rows={3} placeholder="e.g. 40,000 mid-size Indian logistics fleets…" {...register('targetMarket')} />
              </Field>
            </div>
            <div className="grid md:grid-cols-2 gap-5" style={{ marginTop: 20 }}>
              <Field label="Tags (comma separated)" htmlFor="sp-tags" help="Up to 12 keywords that help discovery.">
                <input id="sp-tags" className={inputCls} placeholder="e.g. b2b, payments, logistics" {...register('tags')} />
              </Field>
              <Field label="Pitch deck link" htmlFor="sp-deck" help={<span>Point at a file from your <Link to="/documents" style={{ fontWeight: 700 }}>Documents vault</Link> after uploading it there.</span>}>
                <input id="sp-deck" className={inputCls} placeholder="Paste the document download link" {...register('pitchDeckUrl')} />
              </Field>
            </div>
          </Section>

          <div className="flex items-center gap-3 pt-1 flex-wrap">
            <Button type="submit" loading={saving}><Save size={16} /> {startup ? 'Save changes' : 'Create profile'}</Button>
            {startup && <Button type="button" variant="danger" onClick={handleDelete}><Trash2 size={16} /> Delete</Button>}
          </div>
        </form>
      </Card>
    </div>
  )
}
