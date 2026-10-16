import React, { useEffect, useState } from 'react'
import { BadgeCheck, TrendingUp, ShieldCheck, ArrowRight } from 'lucide-react'
import './hero-visual.css'

const FACTORS = [
  { name: 'Industry', w: 30 },
  { name: 'Cheque range', w: 25 },
  { name: 'Stage', w: 15 },
  { name: 'Risk appetite', w: 10 },
  { name: 'Location', w: 10 },
  { name: 'Equity fit', w: 10 },
]

const RING_C = 2 * Math.PI * 34

export default function HeroVisual() {
  const [score, setScore] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setScore(92)
      return
    }
    let raf
    const t0 = performance.now()
    const tick = now => {
      const p = Math.min(1, (now - t0) / 1600)
      const eased = 1 - Math.pow(1 - p, 3)
      setScore(Math.round(92 * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  /* Cursor-follow tilt removed — the hero card is a static product snapshot. */

  return (
    <div className="hv-stage" aria-hidden="true">
      <div className="hv-main">
        <div className="hv-main-head">
          <span className="hv-avatar">KE</span>
          <span className="hv-id">
            <b>Kestrel Capital <BadgeCheck size={14} /></b>
            <small>Seed · Fintech · Bengaluru</small>
          </span>
          <span className="hv-live"><i />Live match</span>
        </div>

        <div className="hv-proof">
          <ShieldCheck size={14} />
          <span><b>Verified profile</b> · Identity + claims checked</span>
        </div>

        <div className="hv-score-row">
          <svg className="hv-ring" viewBox="0 0 84 84">
            <circle cx="42" cy="42" r="34" stroke="rgba(20,184,166,.18)" strokeWidth="9" fill="none" />
            <circle
              cx="42" cy="42" r="34" fill="none"
              stroke="#14B8A6" strokeWidth="9" strokeLinecap="butt"
              strokeDasharray={RING_C}
              strokeDashoffset={RING_C - (RING_C * score) / 100}
              transform="rotate(-90 42 42)"
            />
            <text x="42" y="40" textAnchor="middle" className="hv-ring-num">{score}</text>
            <text x="42" y="54" textAnchor="middle" className="hv-ring-sub">/ 100</text>
          </svg>
          <div className="hv-bars">
            {FACTORS.map((f, i) => (
              <div className="hv-bar" key={f.name}>
                <span>{f.name}</span>
                <span className="hv-track"><i style={{ '--w': `${f.w * 3.2}%`, animationDelay: `${0.35 + i * 0.12}s` }} /></span>
                <b>+{f.w}</b>
              </div>
            ))}
          </div>
        </div>

        <div className="hv-stats">
          <div className="hv-stat">
            <span className="hv-ticks"><i /><i /><i /></span>
            <span>
              <small>Cheque range</small>
              <b>$100K – $5M</b>
            </span>
          </div>
          <div className="hv-stat">
            <TrendingUp size={15} className="hv-stat-ico" />
            <span>
              <small>Portfolio growth</small>
              <b>+48%</b>
            </span>
            <svg className="hv-spark" viewBox="0 0 96 32" fill="none">
              <polyline points="2,27 18,23 34,24 50,16 66,18 82,8 94,10" stroke="#14B8A6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div className="hv-main-foot">
          <span className="hv-cta">Request intro <ArrowRight size={14} /></span>
          <span className="hv-verdict">Strong fit</span>
        </div>
      </div>
    </div>
  )
}
