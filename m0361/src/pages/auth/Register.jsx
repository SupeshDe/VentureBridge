import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, AlertCircle, UserCheck, Briefcase } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import logoUrl from '../../assets/logo-128.webp'
import './register-card.css'

function RocketArt() {
  return (
    <svg viewBox="0 0 400 560" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Rocket launching">
      {/* stars */}
      <g fill="#f8f7f4">
        <circle cx="52" cy="70" r="2.5" opacity="0.9" />
        <circle cx="120" cy="150" r="2" opacity="0.6" />
        <circle cx="70" cy="250" r="2.5" opacity="0.7" />
        <circle cx="200" cy="60" r="2" opacity="0.6" />
        <circle cx="310" cy="120" r="2.5" opacity="0.8" />
        <circle cx="352" cy="230" r="2" opacity="0.6" />
        <circle cx="250" cy="180" r="1.8" opacity="0.5" />
        <circle cx="150" cy="330" r="2" opacity="0.5" />
        <circle cx="40" cy="400" r="2.2" opacity="0.6" />
        <circle cx="330" cy="330" r="2.2" opacity="0.6" />
      </g>
      {/* confetti triangles */}
      <g fill="none" stroke="#f8f7f4" strokeWidth="2.5" strokeLinejoin="round">
        <path d="M318 52 L334 80 L302 80 Z" opacity="0.9" />
        <path d="M84 210 L100 238 L68 238 Z" opacity="0.75" />
        <path d="M330 270 L348 300 L312 300 Z" opacity="0.85" />
        <path d="M52 330 L62 348 L42 348 Z" opacity="0.6" />
        <path d="M250 90 L260 106 L240 106 Z" opacity="0.6" />
        <path d="M120 420 L134 444 L106 444 Z" opacity="0.55" />
      </g>
      <g fill="#f8f7f4" opacity="0.85">
        <circle cx="230" cy="130" r="3" />
        <circle cx="90" cy="290" r="3" />
        <circle cx="360" cy="180" r="3" />
      </g>
      {/* exhaust smoke */}
      <g fill="#f8f7f4" opacity="0.28">
        <circle cx="200" cy="470" r="26" />
        <circle cx="172" cy="492" r="20" />
        <circle cx="228" cy="494" r="22" />
      </g>
      {/* rocket */}
      <g className="rg-rocket">
        <path d="M200 130 C226 170 232 220 228 268 L172 268 C168 220 174 170 200 130 Z" fill="#f8f7f4" />
        <path d="M200 130 C210 148 216 166 219 184 L181 184 C184 166 190 148 200 130 Z" fill="#0057ff" opacity="0.9" />
        <circle cx="200" cy="218" r="17" fill="#0057ff" />
        <circle cx="200" cy="218" r="10" fill="#f8f7f4" />
        <path d="M172 240 L148 296 L172 284 Z" fill="#f8f7f4" />
        <path d="M228 240 L252 296 L228 284 Z" fill="#f8f7f4" />
        <rect x="188" y="268" width="24" height="14" rx="4" fill="#0057ff" />
        <path className="rg-flame" d="M200 282 C214 306 212 330 200 352 C188 330 186 306 200 282 Z" fill="#f8f7f4" />
        <path className="rg-flame" d="M200 296 C207 310 206 326 200 338 C194 326 193 310 200 296 Z" fill="#0057ff" />
      </g>
      {/* bottom wave */}
      <path d="M0 470 C60 440 110 500 170 478 C230 456 260 500 320 484 C360 474 380 488 400 482 L400 560 L0 560 Z" fill="#f8f7f4" />
    </svg>
  )
}

export default function Register() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [notice, setNotice] = useState('')

  const { register: registerUser, verifyEmail } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: { role: 'entrepreneur' } })

  const watchRole = watch('role')

  const onSubmit = async data => {
    setIsLoading(true)
    setError('')
    setNotice('')
    try {
      const res = await registerUser(data)
      if (res?.pendingVerification) {
        setPendingEmail(data.email.trim().toLowerCase())
        setPending(true)
        window.scrollTo({ top: 0 })
        return
      }
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const onVerify = async event => {
    event.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      await verifyEmail(pendingEmail, verificationCode)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Email verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  const onResend = async () => {
    setIsResending(true)
    setError('')
    setNotice('')
    try {
      const response = await api.resendVerificationCode(pendingEmail)
      setNotice(response.message)
    } catch (err) {
      setError(err.message || 'Could not resend the verification code')
    } finally {
      setIsResending(false)
    }
  }

  if (pending) {
    return (
      <div className="rg-page">
        <div className="rg-card" style={{ maxWidth: 560 }}>
          <div className="rg-form" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '56px 40px' }}>
            <h1>Verify your email</h1>
            <p className="rg-sub" style={{ marginBottom: 8 }}>
              Enter the six-digit code we sent to <strong>{pendingEmail}</strong>.
            </p>
            {error && <div className="rg-error" role="alert"><AlertCircle size={16} /><span>{error}</span></div>}
            {notice && <p className="rg-sub" role="status">{notice}</p>}
            <form onSubmit={onVerify}>
              <label className="rg-label" htmlFor="rg-code">Verification code</label>
              <input
                id="rg-code"
                className="rg-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                pattern="[0-9]{6}"
                value={verificationCode}
                onChange={event => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                aria-label="Six-digit verification code"
              />
              <button type="submit" className="rg-submit" disabled={isLoading || verificationCode.length !== 6}>
                {isLoading ? 'Verifying…' : 'Verify email'}
              </button>
            </form>
            <button type="button" className="rg-submit" style={{ marginTop: 12, background: 'transparent', color: '#0057ff' }} onClick={onResend} disabled={isResending}>
              {isResending ? 'Sending…' : 'Resend code'}
            </button>
            <p className="rg-switch">
              Already verified? <Link to="/auth/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rg-page">
      <div className="rg-card">
        <div className="rg-form">
          <Link className="rg-brand" to="/">
            <img src={logoUrl} alt="VentureBridge" width="24" height="24" decoding="async" style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: '50%' }} />venturebridge
          </Link>
          <h1>Registration Form</h1>
          <p className="rg-sub">Create your account to start meeting the right people.</p>

          {error && (
            <div className="rg-error" role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="rg-roles" role="radiogroup" aria-label="I am a">
            <label className={`rg-role ${watchRole === 'entrepreneur' ? 'on' : ''}`}>
              <input type="radio" value="entrepreneur" {...register('role', { required: true })} />
              <Briefcase size={16} />
              <span>Entrepreneur<small>Raising funds</small></span>
            </label>
            <label className={`rg-role ${watchRole === 'investor' ? 'on' : ''}`}>
              <input type="radio" value="investor" {...register('role', { required: true })} />
              <UserCheck size={16} />
              <span>Investor<small>Deploying capital</small></span>
            </label>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <label className="rg-label" htmlFor="rg-name">Full name</label>
            <input
              id="rg-name"
              className="rg-input"
              type="text"
              autoComplete="name"
              placeholder="Aarav Sharma"
              {...register('name', {
                required: 'Name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' },
              })}
            />
            {errors.name && <span className="rg-field-error">{errors.name.message}</span>}

            <label className="rg-label" htmlFor="rg-email">Email</label>
            <input
              id="rg-email"
              className="rg-input"
              type="email"
              autoComplete="email"
              placeholder="you@startup.in"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' },
              })}
            />
            {errors.email && <span className="rg-field-error">{errors.email.message}</span>}

            <label className="rg-label" htmlFor="rg-password">Password</label>
            <div className="rg-password">
              <input
                id="rg-password"
                className="rg-input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Minimum 8 characters"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' },
                })}
              />
              <button
                type="button"
                className="rg-eye"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(s => !s)}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && <span className="rg-field-error">{errors.password.message}</span>}

            <button type="submit" className="rg-submit" disabled={isLoading}>
              {isLoading ? 'Creating account…' : 'Register'}
            </button>
          </form>

          <p className="rg-switch">
            Already have an account? <Link to="/auth/login">Sign in</Link>
          </p>
        </div>

        <aside className="rg-art" aria-hidden="true">
          <RocketArt />
        </aside>
      </div>
    </div>
  )
}
