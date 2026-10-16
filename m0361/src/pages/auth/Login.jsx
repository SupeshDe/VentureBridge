import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, AlertCircle, Info } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import logoUrl from '../../assets/logo-128.webp'
import './login-split.css'

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('email')
  const [remember, setRemember] = useState(true)
  const [fpNote, setFpNote] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const redirectPath = location.state?.from || '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async data => {
    setIsLoading(true)
    setError('')
    try {
      await login(data)
      navigate(redirectPath, { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="li-split">
      <aside className="li-art">
        <Link className="li-brand" to="/">
          <img src={logoUrl} alt="VentureBridge" width="26" height="26" decoding="async" style={{ width: 26, height: 26, objectFit: 'contain', borderRadius: '50%' }} />venturebridge
        </Link>
        <div className="li-art-body">
          <div className="li-sample" aria-hidden="true">
            <div className="li-sample-head">
              <span className="li-sample-avatar">NC</span>
              <span className="li-sample-id">
                <b>Northstar Ventures</b>
                <small>Seed · SaaS · Mumbai</small>
              </span>
              <span className="li-sample-score">92<small>/100</small></span>
            </div>
            <div className="li-sample-rows">
              <div><span>Industry</span><i style={{ width: '96%' }} /><b>+30</b></div>
              <div><span>Cheque range</span><i style={{ width: '80%' }} /><b>+25</b></div>
              <div><span>Stage</span><i style={{ width: '48%' }} /><b>+15</b></div>
            </div>
            <div className="li-sample-foot">
              <span>Verified profile</span>
              <span>Strong fit</span>
            </div>
          </div>
          <p className="li-art-caption">
            <strong>80% fit before the first call.</strong>
            <span>Founders list once. Investors screen verified profiles. No cold emails.</span>
          </p>
        </div>
        <p className="li-art-foot">© {new Date().getFullYear()} VentureBridge Technologies Pvt. Ltd.</p>
      </aside>

      <main className="li-form-wrap">
        <div className="li-form">
          <Link className="li-brand li-brand-mobile" to="/">
            <img src={logoUrl} alt="VentureBridge" width="26" height="26" decoding="async" style={{ width: 26, height: 26, objectFit: 'contain', borderRadius: '50%' }} />venturebridge
          </Link>
          <h1>Welcome to VentureBridge!</h1>
          <p className="li-sub">The founder–investor network. Sign in to continue.</p>

          <div className="li-tabs" role="tablist" aria-label="Sign-in method">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'email'}
              className={tab === 'email' ? 'on' : ''}
              onClick={() => setTab('email')}
            >
              Email
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'phone'}
              className={tab === 'phone' ? 'on' : ''}
              onClick={() => setTab('phone')}
            >
              Phone
            </button>
          </div>

          {error && (
            <div className={error.toLowerCase().includes('verif') ? 'li-note' : 'li-error'} role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {tab === 'email' ? (
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <label className="li-label" htmlFor="li-email">Email address</label>
              <input
                id="li-email"
                className="li-input"
                type="email"
                autoComplete="email"
                placeholder="you@startup.in"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' },
                })}
              />
              {errors.email && <span className="li-field-error">{errors.email.message}</span>}

              <label className="li-label" htmlFor="li-password">Password</label>
              <div className="li-password">
                <input
                  id="li-password"
                  className="li-input"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  className="li-eye"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(s => !s)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <span className="li-field-error">{errors.password.message}</span>}

              <div className="li-row">
                <label className="li-check">
                  <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
                  <span className="li-box" aria-hidden="true">{remember && <CheckMark />}</span>
                  Keep me signed in
                </label>
                <button type="button" className="li-link" onClick={() => setFpNote(v => !v)}>
                  Forgot password?
                </button>
              </div>
              {fpNote && (
                <p className="li-note">
                  <Info size={14} /> Password reset isn&apos;t self-serve in this build — write to us from your
                  registered email and we&apos;ll help.
                </p>
              )}

              <button type="submit" className="li-submit" disabled={isLoading}>
                {isLoading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          ) : (
            <div>
              <p className="li-note">
                <Info size={14} /> Phone sign-in isn&apos;t enabled yet — please use email for now.
              </p>
              <button type="button" className="li-submit" disabled>
                Sign in
              </button>
            </div>
          )}

          <p className="li-switch">
            First time here? <Link to="/auth/register">Sign up</Link> instead.
          </p>
        </div>
      </main>
    </div>
  )
}

function CheckMark() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M2 6.5 L5 9 L10 3" stroke="#f8f7f4" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
