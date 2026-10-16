import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../context/AuthContext'
import { UserCheck, Save, AlertCircle, CheckCircle2 } from 'lucide-react'
import api from '../../services/api'
import { ReviewsBlock } from '../../components/ui/StarRating'
import { INDUSTRIES, STAGES, RISK_LEVELS, INVESTMENT_TYPES } from '../../constants'
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

function ChipRow({ options, selected = [], onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => {
        const on = selected.includes(o)
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(o)}
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

export default function InvestorProfile() {
const { user } = useAuth()
const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [details, setDetails] = useState([])
  const [success, setSuccess] = useState('')

  const { register, handleSubmit, reset, watch, setValue, getValues, formState: { errors } } = useForm({
    defaultValues: { preferredIndustries: [], preferredStages: [], riskPreference: '', investmentType: '' },
  })

  const industries = watch('preferredIndustries') || []
  const customIndustry = watch('customIndustry') || ''
  const stages = watch('preferredStages') || []
  const minWatch = watch('min')
  const maxWatch = watch('max')

  useEffect(() => { fetchProfile() }, [])

  async function fetchProfile() {
    try {
      const res = await api.getMyInvestorProfile()
      if (!res.data) {
        setProfile(null)
        return
      }
      setProfile(res.data)
      reset({
        organization: res.data.organization || '',
        bio: res.data.bio || '',
        location: res.data.location || '',
        riskPreference: res.data.riskPreference || '',
        investmentType: res.data.investmentType || '',
        preferredIndustries: [
          ...(res.data.preferredIndustries || []).filter(
            industry => INDUSTRIES.includes(industry) && industry !== 'Other'
          ),
          ...((res.data.preferredIndustries || []).some(
            industry => !INDUSTRIES.includes(industry) || industry === 'Other'
          ) ? ['Other'] : []),
        ],
        customIndustry: (res.data.preferredIndustries || [])
          .filter(industry => !INDUSTRIES.includes(industry))
          .join(', '),
        preferredStages: res.data.preferredStages || [],
        locations: (res.data.preferredLocations || []).join(', '),
        min: res.data.investmentRange?.minimum ?? '',
        max: res.data.investmentRange?.maximum ?? '',
        equityMin: res.data.equityMin ?? '',
        equityMax: res.data.equityMax ?? '',
      })
    } catch (e) {
      if (!e.message.includes('not created')) { setError(e.message); setDetails(e.details || []) }
    } finally {
      setLoading(false)
    }
  }

  function toggle(listName, value) {
    const cur = getValues(listName) || []
    setValue(listName, cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value], { shouldValidate: true })
  }

  const onSubmit = async data => {
    setSaving(true); setError(''); setDetails([]); setSuccess('')
    try {
      const payload = {
        organization: data.organization?.trim(),
        bio: data.bio?.trim(),
        location: data.location?.trim(),
        riskPreference: data.riskPreference || undefined,
        investmentType: data.investmentType || undefined,
        preferredIndustries: [
          ...(data.preferredIndustries || []).filter(industry => industry !== 'Other'),
          ...((data.preferredIndustries || []).includes('Other')
            ? customIndustry.split(',').map(industry => industry.trim()).filter(Boolean)
            : []),
        ],
        preferredStages: data.preferredStages || [],
        preferredLocations: data.locations ? data.locations.split(',').map(s => s.trim()).filter(Boolean) : [],
        investmentRange: { minimum: Number(data.min) || 0, maximum: Number(data.max) || 0 },
        equityMin: data.equityMin === '' ? 0 : Number(data.equityMin),
        equityMax: data.equityMax === '' ? 100 : Number(data.equityMax),
      }
      const res = profile ? await api.updateInvestorProfile(payload) : await api.createInvestorProfile(payload)
      setProfile(res.data)
      setSuccess(profile ? 'Profile updated successfully.' : 'Profile created successfully.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      setError(e.message || 'Could not save — please check the highlighted fields.')
      setDetails(e.details || [])
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="page-wrap"><div className="py-16 text-center text-[#0057ff]">Loading…</div></div>

  return (
    <div className="page-wrap">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#0057ff] grid place-items-center text-white" style={{ flex: 'none' }}>
          <UserCheck size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#0057ff]">{profile ? 'Manage investor profile' : 'Create investor profile'}</h1>
          <p className="text-sm text-[#0057ff]">Define your thesis so the matching engine can find founders you&apos;ll love.</p>
        </div>
{profile?.isVerified && <Badge variant="success">Verified</Badge>}
</div>
{profile && (
<Card className="mb-4">
<h2 className="text-base font-bold text-[#0057ff] mb-2">What founders say</h2>
<ReviewsBlock userId={user?._id || user?.id} api={api} />
</Card>
)}

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

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-7">
          <Section step="1" title="Who are you?" hint="Founders see this first. A real organization name builds instant trust.">
            <div className="grid md:grid-cols-2 gap-5">
              <Field label="Organization name" htmlFor="ip-org" required error={errors.organization?.message}>
                <input
                  id="ip-org"
                  className={inputCls}
                  placeholder="e.g. Kestrel Capital"
                  {...register('organization', { required: 'Give your fund or syndicate a name.', minLength: { value: 2, message: 'At least 2 characters.' } })}
                />
              </Field>
              <Field label="Based in" htmlFor="ip-loc" help="City (and country). Used for the 10% location part of your match score.">
                <input id="ip-loc" className={inputCls} placeholder="e.g. Mumbai, India" {...register('location')} />
              </Field>
            </div>
            <div style={{ marginTop: 20 }}>
              <Field
                label="Investment thesis"
                htmlFor="ip-bio"
                help="2–3 sentences: what you back, at what stage, and what makes you say yes. Founders read this before requesting."
                error={errors.bio?.message}
              >
                <textarea
                  id="ip-bio"
                  className={inputCls}
                  rows={4}
                  placeholder="e.g. We back pre-seed fintech and SaaS teams in India with ₹50L–₹2Cr first cheques. Former operators; we lead with conviction and follow fast."
                  {...register('bio', { maxLength: { value: 4000, message: 'Keep it under 4000 characters.' } })}
                />
              </Field>
            </div>
          </Section>

          <Section step="2" title="How do you invest?" hint="These three settings drive 25% of every match score.">
            <div className="grid md:grid-cols-2 gap-5">
              <Field label="Risk appetite" htmlFor="ip-risk" help="Pick the profile that fits most of your portfolio.">
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Risk appetite">
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
              <Field label="Instrument" htmlFor="ip-type" help="The vehicle you usually deploy through.">
                <select id="ip-type" className={inputCls} style={{ background: '#f8f7f4' }} {...register('investmentType')}>
                  <option value="">Select one…</option>
                  {INVESTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
            </div>
          </Section>

          <Section step="3" title="What do you want to see?" hint="Tap to select. Matches are ranked by overlap with these picks — industry alone is worth 30%.">
            <div className="grid gap-5">
              <Field
                label={`Sectors (${industries.length} selected)`}
                htmlFor="ip-ind"
                error={industries.length === 0 ? '' : undefined}
                help={industries.length === 0 ? 'Pick at least one sector, or you will match with everything.' : undefined}
              >
                <span id="ip-ind" />
                <ChipRow options={INDUSTRIES} selected={industries} onToggle={v => toggle('preferredIndustries', v)} />
                {industries.includes('Other') && (
                  <input
                    id="ip-custom-industry"
                    className={inputCls}
                    style={{ marginTop: 12 }}
                    placeholder="Type your industry (or comma-separated industries)"
                    {...register('customIndustry', {
                      validate: value => !industries.includes('Other') || Boolean(value?.trim()) || 'Enter at least one industry.',
                    })}
                  />
                )}
                {industries.includes('Other') && errors.customIndustry && (
                  <span className={errCls} role="alert">! {errors.customIndustry.message}</span>
                )}
              </Field>
              <Field label={`Stages (${stages.length} selected)`} htmlFor="ip-stg">
                <span id="ip-stg" />
                <ChipRow options={STAGES} selected={stages} onToggle={v => toggle('preferredStages', v)} />
              </Field>
              <Field label="Preferred cities" htmlFor="ip-locs" help="Comma-separated, e.g. Bengaluru, Mumbai, Delhi. Leave blank to stay geography-agnostic.">
                <input id="ip-locs" className={inputCls} placeholder="e.g. Bengaluru, Mumbai" {...register('locations')} />
              </Field>
            </div>
          </Section>

          <Section step="4" title="Cheque and equity" hint="Founders filter by these numbers first. Amounts are in rupees — the lakh value previews as you type.">
            <div className="grid md:grid-cols-2 gap-5">
              <Field
                label="Smallest cheque (₹)"
                htmlFor="ip-min"
                required
                help={minWatch ? `≈ ${formatLakhs(Number(minWatch) || 0)}` : 'e.g. 5000000 for ₹50L'}
                error={errors.min?.message}
              >
                <input
                  id="ip-min"
                  type="number"
                  min="0"
                  className={inputCls}
                  placeholder="e.g. 5000000"
                  {...register('min', {
                    required: 'Enter the smallest cheque you write.',
                    min: { value: 0, message: 'Cannot be negative.' },
                    validate: v => Number(v) > 0 || 'Must be more than zero.',
                  })}
                />
              </Field>
              <Field
                label="Largest cheque (₹)"
                htmlFor="ip-max"
                required
                help={maxWatch ? `≈ ${formatLakhs(Number(maxWatch) || 0)}` : 'Must be at least your smallest cheque.'}
                error={errors.max?.message}
              >
                <input
                  id="ip-max"
                  type="number"
                  min="0"
                  className={inputCls}
                  placeholder="e.g. 40000000"
                  {...register('max', {
                    required: 'Enter the largest cheque you write.',
                    validate: v => Number(v) >= Number(getValues('min') || 0) || 'Must be at least the smallest cheque.',
                  })}
                />
              </Field>
              <Field label="Minimum equity (%)" htmlFor="ip-eqmin" help="Smallest stake you would take. Optional.">
                <input id="ip-eqmin" type="number" min="0" max="100" className={inputCls} placeholder="e.g. 5" {...register('equityMin', { min: { value: 0, message: '0–100 only.' }, max: { value: 100, message: '0–100 only.' } })} />
                {errors.equityMin && <span className={errCls} role="alert">! {errors.equityMin.message}</span>}
              </Field>
              <Field label="Maximum equity (%)" htmlFor="ip-eqmax" help="Largest stake you would take. Optional.">
                <input id="ip-eqmax" type="number" min="0" max="100" className={inputCls} placeholder="e.g. 20" {...register('equityMax', { min: { value: 0, message: '0–100 only.' }, max: { value: 100, message: '0–100 only.' } })} />
                {errors.equityMax && <span className={errCls} role="alert">! {errors.equityMax.message}</span>}
              </Field>
            </div>
          </Section>

          <div className="flex gap-3 pt-1">
            <Button type="submit" loading={saving}><Save size={16} /> {profile ? 'Save changes' : 'Create profile'}</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
