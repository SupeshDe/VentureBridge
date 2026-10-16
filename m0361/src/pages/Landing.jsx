import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, ArrowUpRight, Check, ShieldCheck, Search, MessageCircle,
  Building2, Users, FileText, Menu, X, ChevronLeft, ChevronRight, Lock,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import HeroVisual from './HeroVisual'
import logoUrl from '../assets/logo-128.webp'
import './landing.css'

const SECTORS = ['Fintech', 'SaaS', 'Healthtech', 'Logistics', 'Climate', 'Edtech', 'Marketplace', 'AI Infrastructure', 'Consumer', 'DeepTech']
const FIRMS = ['NORTHSTAR', 'KESTREL', 'ARTHA PARTNERS', 'DECCAN CAPITAL', 'FIELDSTONE', 'MERIDIAN']

const TESTIMONIALS = [
  {
    quote: 'Our first three calls all started with the investor already understanding our raise and stage. We closed our seed in eleven weeks, most of it from one shortlist.',
    name: 'Ananya Rao', role: 'Co-founder, AeroPay · Logistics fintech, Seed',
  },
  {
    quote: 'I screen about forty profiles a month here. The fit breakdown tells me in ten seconds whether a cheque-size conversation is even worth having.',
    name: 'Vikram Mehta', role: 'Partner, Kestrel Capital · Pre-seed to Series A',
  },
  {
    quote: 'Verification mattered to us. When a profile says revenue and stage, it has actually been checked. That alone saved us two wasted diligence cycles.',
    name: 'Sarah D’Souza', role: 'Founder, ClinicLoop · Healthtech, Pre-seed',
  },
]

const FAQS = [
  {
    q: 'Does VentureBridge invest or move money?',
    a: 'No. We are a discovery and communication layer only. Introductions, requests, connections and chat happen here; term sheets, diligence and transfers happen off-platform between you and the counterparty.',
  },
  {
    q: 'How is the match score actually computed?',
    a: 'Six factors with fixed weights: industry (30), cheque-range overlap (25), stage (15), risk appetite (10), location (10) and equity compatibility (10). Every score ships with its full breakdown — try the demo below, it runs the same logic.',
  },
  {
    q: 'What does verification check?',
    a: 'Identity, organisational affiliation and the headline claims on a profile (sector, stage, raise range). Verified profiles show a badge and rank higher in discovery. It usually takes one to two business days.',
  },
  {
    q: 'Can I keep my startup private while I explore?',
    a: 'Yes. Visibility is per-profile. A private profile still receives matches but is hidden from browse and search until you choose to publish.',
  },
  {
    q: 'What does it cost?',
    a: 'Listing and browsing are free during the current beta. Paid plans will only ever cover outreach volume and analytics — never placement in results. We do not take a cut of any raise.',
  },
]

const ACTIVITY = [
  { icon: Check, title: 'New 88% match', sub: 'Kestrel Capital · Seed · 2m ago' },
  { icon: MessageCircle, title: 'Request accepted', sub: 'Northstar wants to talk · 14m ago' },
  { icon: ShieldCheck, title: 'Profile verified', sub: 'Badge issued · 1h ago' },
]

function MatchVisual() {
  return null
}

function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.rv'))
    if (!('IntersectionObserver' in window)) {
      els.forEach(e => e.classList.add('rv-in'))
      return
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('rv-in')
          io.unobserve(en.target)
        }
      })
    }, { threshold: 0.12 })
    els.forEach(e => io.observe(e))
    return () => io.disconnect()
  }, [])
}

function useCountUp(target, start) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!start) return
    let raf
    const t0 = performance.now()
    const dur = 1400
    const tick = now => {
      const p = Math.min(1, (now - t0) / dur)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(target * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [start, target])
  return val
}

function Metrics() {
  const ref = useRef(null)
  const [start, setStart] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setStart(true); io.disconnect() }
    }, { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const a = useCountUp(1240, start)
  const b = useCountUp(38400, start)
  const c = useCountUp(87, start)
  const items = [
    { v: a.toLocaleString('en-IN'), label: 'Verified founder and investor profiles live' },
    { v: b.toLocaleString('en-IN'), label: 'Connection requests sent to date' },
    { v: `${c}%`, label: 'Introductions with mutual fit above 70%' },
    { v: '3 days', label: 'Median time to first reply after acceptance' },
  ]
  return (
    <div className="lp-metrics" ref={ref}>
      {items.map((m, i) => (
        <div className="lp-metric" key={i}>
          <strong>{m.v}</strong>
          <span>{m.label}</span>
        </div>
      ))}
    </div>
  )
}

function HeroProof() {
  const ref = useRef(null)
  const [n, setN] = useState([0, 0])
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf
    let started = false
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started) {
        started = true
        const t0 = performance.now()
        const tick = now => {
          const p = Math.min(1, (now - t0) / 1600)
          const ez = 1 - Math.pow(1 - p, 3)
          setN([Math.round(1240 * ez), Math.round(38400 * ez)])
          if (p < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        io.disconnect()
      }
    }, { threshold: 0.4 })
    io.observe(el)
    return () => { io.disconnect(); cancelAnimationFrame(raf) }
  }, [])
  return (
    <div className="lp-hero-proof" ref={ref}>
      <div><strong>{n[0].toLocaleString('en-IN')}+</strong><span>verified profiles</span></div>
      <div><strong>{n[1].toLocaleString('en-IN')}</strong><span>intros requested</span></div>
      <div><strong>3 days</strong><span>median first reply</span></div>
    </div>
  )
}

export default function Landing() {
  const { isAuthenticated } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [tab, setTab] = useState('founders')
  const [qi, setQi] = useState(0)
  const [faqOpen, setFaqOpen] = useState(0)

  useReveal()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Matcher demo state
  const [mIndustry, setMIndustry] = useState('SaaS')
  const [mStage, setMStage] = useState('Seed')
  const [mRaise, setMRaise] = useState(8000000)
  const [mRisk, setMRisk] = useState('Medium')
  const [mLocation, setMLocation] = useState('Bengaluru')

  const match = useMemo(() => {
    // Mirrors server weights: industry 30, range 25, stage 15, risk 10, location 10, equity 10
    const investor = {
      industries: ['SaaS', 'Fintech', 'AI Infrastructure'],
      stages: ['Seed', 'Series A'],
      min: 5000000, max: 40000000,
      risk: 'Medium', locations: ['Bengaluru', 'Mumbai'],
    }
    const factors = [
      { name: 'Industry', w: 30, hit: investor.industries.includes(mIndustry) },
      { name: 'Cheque range', w: 25, hit: mRaise >= investor.min && mRaise <= investor.max },
      { name: 'Stage', w: 15, hit: investor.stages.includes(mStage) },
      { name: 'Risk appetite', w: 10, hit: investor.risk === mRisk },
      { name: 'Location', w: 10, hit: investor.locations.includes(mLocation) },
      { name: 'Equity fit', w: 10, hit: true },
    ]
    const score = factors.reduce((s, f) => s + (f.hit ? f.w : 0), 0)
    return { factors, score }
  }, [mIndustry, mStage, mRaise, mRisk, mLocation])

  const verdict = match.score >= 75 ? { t: 'Strong fit', c: 'good' } : match.score >= 50 ? { t: 'Worth a conversation', c: 'mid' } : { t: 'Weak fit', c: 'low' }


  const primaryTo = isAuthenticated ? '/dashboard' : '/auth/register'

  return (
    <div className="lp-root">
      <div className="lp-topbar">
        <div className="lp-wrap">
          <span className="lp-dot" aria-hidden />
          <span>Verification queue is open — median review time 1–2 business days.</span>
          <span className="spacer" />
          <time>Updated weekly · No payments move on this platform</time>
        </div>
      </div>

      <header className={`lp-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="lp-wrap">
          <Link className="lp-brand" to="/">
            <img src={logoUrl} alt="VentureBridge" width="30" height="30" decoding="async" style={{ width: 30, height: 30, objectFit: 'contain', borderRadius: '50%' }} />
            venturebridge
            <small>BETA</small>
          </Link>
          <nav className="lp-links" aria-label="Primary">
            <a href="#how">How it works</a>
            <a href="#product">Product</a>
            <a href="#matching">Matching</a>
            <a href="#security">Security</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className={`lp-nav-cta ${menuOpen ? 'open' : ''}`}>
            <Link className="lp-signin" to={isAuthenticated ? '/dashboard' : '/auth/login'}>
              {isAuthenticated ? 'Open dashboard' : 'Sign in'}
            </Link>
            <Link className="lp-btn lp-btn-primary lp-btn-sm" to={primaryTo}>
              Create profile <ArrowRight size={15} />
            </Link>
          </div>
          <button className="lp-burger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu" aria-expanded={menuOpen}>
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      <main>
        {/* HERO */}
<section className="lp-hero">
          <span className="lp-hero-dots" aria-hidden="true" />
          <div className="lp-wrap">
            <div className="lp-hero-copy rv">
              <p className="lp-hero-eyebrow">Founder – investor network</p>
              <h1 className="lp-hero-h1">Stop pitching strangers.<br /><span>Start every call at 80%.</span></h1>
              <p className="lp-hero-sub">VentureBridge scores every founder–investor pair on thesis, cheque size and stage — so you walk into the first call informed, not cold.</p>
              <div className="lp-hero-ctas">
                <Link className="lp-btn lp-btn-light" to={primaryTo}>Create your profile <ArrowRight size={16} /></Link>
                <a className="lp-btn lp-btn-outline-w" href="#matching">See how matching works</a>
              </div>
              <HeroProof />
            </div>
            <div className="lp-character-wrap rv">
              <HeroVisual />
            </div>
          </div>
        </section>
{/* TICKER */}
        <div className="lp-ticker">
          <div className="lp-wrap">
            <small>Screening now</small>
            <div className="lp-marquee" aria-hidden>
              <div className="lp-marquee-track">
                {[...FIRMS, ...FIRMS].map((f, i) => <span key={i}>{f}<i>·</i></span>)}
              </div>
            </div>
          </div>
        </div>

        {/* HOW */}
        <section className="lp-section bordered" id="how">
          <div className="lp-wrap">
            <p className="lp-kicker rv">How it works</p>
            <h2 className="lp-h2 rv">Three steps. No cold-email spreadsheets.</h2>
            <p className="lp-sub rv">Most founders finish a profile in about fifteen minutes. Investors usually build their first shortlist the same afternoon.</p>
            <div className="lp-steps rv">
              <div className="lp-step">
                <span className="lp-step-no">01</span>
                <h3>List once, properly</h3>
                <p>Raise, runway, revenue band, team and what “good” looks like. Our team verifies identity and headline claims within two business days.</p>
                <ul>
                  <li><Check size={15} /> Guided 15-minute profile</li>
                  <li><Check size={15} /> Private-by-default option</li>
                </ul>
              </div>
              <div className="lp-step">
                <span className="lp-step-no">02</span>
                <h3>Get scored, not spammed</h3>
                <p>Every pair gets a 0–100 score across six fixed factors. You see the full breakdown — never a black box.</p>
                <ul>
                  <li><Check size={15} /> Inspectable weights</li>
                  <li><Check size={15} /> Recomputed on each edit</li>
                </ul>
              </div>
              <div className="lp-step">
                <span className="lp-step-no">03</span>
                <h3>Talk when it’s mutual</h3>
                <p>Send a request with context. On acceptance you get a connection and a direct thread. Diligence happens off-platform.</p>
                <ul>
                  <li><Check size={15} /> Request → connect → chat</li>
                  <li><Check size={15} /> Declines stay private</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* PRODUCT TABS */}
        <section className="lp-section alt" id="product">
          <div className="lp-wrap">
            <p className="lp-kicker rv">Product tour</p>
            <h2 className="lp-h2 rv">Built differently for each side of the table.</h2>
            <p className="lp-sub rv">Founders want signal. Investors want pipeline. Same data, two workflows.</p>
            <div className="lp-tabs rv" role="tablist">
              <button className={tab === 'founders' ? 'on' : ''} onClick={() => setTab('founders')} role="tab" aria-selected={tab === 'founders'}>For founders</button>
              <button className={tab === 'investors' ? 'on' : ''} onClick={() => setTab('investors')} role="tab" aria-selected={tab === 'investors'}>For investors</button>
            </div>
            <div className="lp-tabgrid">
              <div className="lp-checklist rv">
                {tab === 'founders' ? (
                  <>
                    <h3>Stop guessing who to email</h3>
                    <p>A shortlist ranked by overlap with your actual raise — with the reasoning attached to every row.</p>
                    <ul>
                      <li><span className="lp-ico"><Search size={15} /></span><div><b>Curated shortlist, refreshed daily</b><span>Filtered by sector, stage, cheque and location. No pay-to-rank, ever.</span></div></li>
                      <li><span className="lp-ico"><FileText size={15} /></span><div><b>“Why this match” on every card</b><span>See which factors passed and which missed before you spend social capital.</span></div></li>
                      <li><span className="lp-ico"><MessageCircle size={15} /></span><div><b>Requests with context</b><span>Attach your deck summary and ask. Track sent, seen and accepted in one place.</span></div></li>
                    </ul>
                    <Link className="lp-btn lp-btn-primary" to={primaryTo}>List your startup <ArrowUpRight size={15} /></Link>
                  </>
                ) : (
                  <>
                    <h3>A pipeline, not an inbox firehose</h3>
                    <p>Screen verified founders against your thesis, then watch the ones that matter.</p>
                    <ul>
                      <li><span className="lp-ico"><Building2 size={15} /></span><div><b>Thesis-first discovery</b><span>Set sectors, stages and cheque bands once; screening respects them automatically.</span></div></li>
                      <li><span className="lp-ico"><Users size={15} /></span><div><b>Watchlists and assignments</b><span>Save, note and share profiles with partners without leaving the thread.</span></div></li>
                      <li><span className="lp-ico"><ShieldCheck size={15} /></span><div><b>Verified claims up front</b><span>Stage, sector and range are checked before a founder can message you.</span></div></li>
                    </ul>
                    <Link className="lp-btn lp-btn-primary" to={primaryTo}>Set up investor profile <ArrowUpRight size={15} /></Link>
                  </>
                )}
              </div>
              <figure className="lp-quotebox rv">
                <blockquote>{TESTIMONIALS[qi].quote}</blockquote>
                <figcaption>
                  <span className="lp-avatar">{TESTIMONIALS[qi].name.split(' ').map(w => w[0]).slice(0, 2).join('')}</span>
                  <div><b>{TESTIMONIALS[qi].name}</b><small>{TESTIMONIALS[qi].role}</small></div>
                </figcaption>
                <div className="lp-quotenav">
                  <button onClick={() => setQi((qi + TESTIMONIALS.length - 1) % TESTIMONIALS.length)} aria-label="Previous story"><ChevronLeft size={16} /></button>
                  <button onClick={() => setQi((qi + 1) % TESTIMONIALS.length)} aria-label="Next story"><ChevronRight size={16} /></button>
                  <span className="lp-qdots">{TESTIMONIALS.map((_, i) => <i key={i} className={i === qi ? 'on' : ''} />)}</span>
                </div>
              </figure>
            </div>
          </div>
        </section>

        {/* MATCHER */}
        <section className="lp-section bordered" id="matching">
          <div className="lp-wrap">
            <p className="lp-kicker rv">Live demo</p>
            <h2 className="lp-h2 rv">Try the scoring logic. It’s the production one.</h2>
            <p className="lp-sub rv">Describe a startup on the left. We score it against a sample Seed thesis (SaaS / Fintech, ₹50L–₹4Cr, Seed–Series A, medium risk, Bengaluru/Mumbai). Change anything and watch the breakdown move.</p>
            <div className="lp-matcher rv">
              <div className="lp-matcher-controls">
                <div className="lp-field">
                  <label>Sector</label>
                  <div className="lp-seg">{['SaaS', 'Fintech', 'Healthtech', 'Climate'].map(s => <button key={s} className={mIndustry === s ? 'on' : ''} onClick={() => setMIndustry(s)}>{s}</button>)}</div>
                </div>
                <div className="lp-field">
                  <label>Stage</label>
                  <div className="lp-seg">{['Pre-seed', 'Seed', 'Series A'].map(s => <button key={s} className={mStage === s ? 'on' : ''} onClick={() => setMStage(s)}>{s}</button>)}</div>
                </div>
                <div className="lp-field">
                  <label>Raise ask (₹)</label>
                  <input type="number" min={100000} step={500000} value={mRaise} onChange={e => setMRaise(Number(e.target.value) || 0)} />
                </div>
                <div className="lp-field">
                  <label>Risk profile</label>
                  <div className="lp-seg">{['Low', 'Medium', 'High'].map(r => <button key={r} className={mRisk === r ? 'on' : ''} onClick={() => setMRisk(r)}>{r}</button>)}</div>
                </div>
                <div className="lp-field" style={{ marginBottom: 0 }}>
                  <label>Base</label>
                  <div className="lp-seg">{['Bengaluru', 'Mumbai', 'Delhi', 'Remote'].map(l => <button key={l} className={mLocation === l ? 'on' : ''} onClick={() => setMLocation(l)}>{l}</button>)}</div>
                </div>
              </div>
              <div className="lp-matcher-result" aria-live="polite">
                <div className="lp-scorehead">
                  <strong>{match.score}</strong>
                  <small>/ 100 fit<br />vs. sample thesis</small>
                  <span className={`lp-verdict ${verdict.c}`}>{verdict.t}</span>
                  <Link className="lp-btn lp-btn-primary lp-btn-sm" to={primaryTo}>Request intro <ArrowRight size={15} /></Link>
                </div>
                {match.factors.map(f => (
                  <div className={`lp-factor ${f.hit ? 'hit' : ''}`} key={f.name}>
                    <span>{f.name} <small style={{ color: '#0057ff' }}>· {f.w}</small></span>
                    <span className="bar"><i style={{ width: f.hit ? '100%' : '4%' }} /></span>
                    <b>{f.hit ? `+${f.w}` : '+0'}</b>
                  </div>
                ))}
                <p className="lp-note">Weights are fixed and public: industry 30 · range 25 · stage 15 · risk 10 · location 10 · equity 10. Sectors on the marquee ({SECTORS.slice(0, 5).join(', ').toLowerCase()}) are the most active this quarter.</p>
              </div>
            </div>
          </div>
        </section>

        {/* METRICS + FEATURES */}
        <section className="lp-section bordered">
          <div className="lp-wrap">
            <p className="lp-kicker rv">Why teams stay</p>
            <h2 className="lp-h2 rv">Quiet software for high-stakes conversations.</h2>
            <p className="lp-sub rv">No leaderboards, no vanity badges. Just the plumbing for finding fit and starting well-informed calls.</p>
            <div style={{ marginBottom: 26 }} className="rv"><Metrics /></div>
            <div className="lp-features">
              {[
                { icon: <Search size={16} />, t: 'Search that respects thesis', d: 'Twelve filters that actually combine — sector, stage, cheque, geography, risk — with counts before you click.' },
                { icon: <ShieldCheck size={16} />, t: 'Verification with teeth', d: 'Claims are checked by a human reviewer. Stale profiles are paused, not left to rot in results.' },
                { icon: <MessageCircle size={16} />, t: 'Chat after acceptance', d: 'Threads open only on mutual interest. Full history, read states and a clean paper trail.' },
                { icon: <Users size={16} />, t: 'Request tracking', d: 'Every intro shows sent, seen, accepted or declined — with private, templated ways to say no.' },
                { icon: <FileText size={16} />, t: 'Rooms for context', d: 'Attach a one-pager, deck summary and links once. Investors see the same packet everywhere.' },
                { icon: <Lock size={16} />, t: 'Controls you can audit', d: 'Role-based access, httpOnly sessions, rate limits and an activity log on sensitive actions.' },
              ].map(f => (
                <div className="lp-feature rv" key={f.t}>
                  <span className="lp-ico">{f.icon}</span>
                  <h3>{f.t}</h3>
                  <p>{f.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECURITY */}
        <section className="lp-section alt" id="security">
          <div className="lp-wrap">
            <p className="lp-kicker rv">Trust & safety</p>
            <h2 className="lp-h2 rv">Serious about data because the conversations are.</h2>
            <p className="lp-sub rv">We hold introductions, decks and messages. That means conservative defaults and plain-English policies.</p>
            <div className="lp-secure">
              <div className="lp-secure-card dark rv">
                <h3>What we will never do</h3>
                <p>Your trust is the product. These are hard lines, not marketing lines.</p>
                <ul className="lp-ticks">
                  <li><Check size={15} color="#FF6B6B" /> Never move money, hold funds, or take a cut of a raise</li>
                  <li><Check size={15} color="#FF6B6B" /> Never sell placement in results or shortlists</li>
                  <li><Check size={15} color="#FF6B6B" /> Never expose a private profile to search or browse</li>
                  <li><Check size={15} color="#FF6B6B" /> Never share your deck outside an accepted connection</li>
                </ul>
              </div>
              <div className="lp-secure-card rv">
                <h3>How we protect you day to day</h3>
                <p>Standard, boring, effective controls — reviewed each release.</p>
                <ul className="lp-ticks">
                  <li><ShieldCheck size={15} color="#0057ff" /> Hashed passwords (bcrypt), httpOnly JWT sessions, HTTPS everywhere</li>
                  <li><ShieldCheck size={15} color="#0057ff" /> Rate limiting, input validation and audit logs on sensitive actions</li>
                  <li><ShieldCheck size={15} color="#0057ff" /> Verification badges and stale-profile suspension to keep data honest</li>
                  <li><ShieldCheck size={15} color="#0057ff" /> One-click export and deletion — your data leaves when you do</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="lp-section bordered" id="faq">
          <div className="lp-wrap">
            <p className="lp-kicker rv">Questions</p>
            <h2 className="lp-h2 rv">Asked on nearly every first call.</h2>
            <div className="lp-faq" style={{ marginTop: 26 }}>
              {FAQS.map((f, i) => (
                <div className={`lp-faq-item rv ${faqOpen === i ? 'open' : ''}`} key={f.q}>
                  <button onClick={() => setFaqOpen(faqOpen === i ? -1 : i)} aria-expanded={faqOpen === i}>
                    <span>{f.q}</span><span>{faqOpen === i ? '−' : '+'}</span>
                  </button>
                  <div className="body"><p>{f.a}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="lp-section">
          <div className="lp-wrap">
            <div className="lp-cta rv">
              <div>
                <h2>List this week. Talk to people who already get it.</h2>
                <p>Profiles reviewed in the order received — most cleared in one to two business days. If you’re raising in the next two quarters, now is the right time to be discoverable.</p>
              </div>
              <div className="lp-cta-actions">
                <Link className="lp-btn lp-btn-light" to={primaryTo}>Create your profile <ArrowRight size={16} /></Link>
                <Link className="lp-btn lp-btn-outline-w" to="/auth/login">Sign in</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="lp-wrap">
          <div className="lp-fgrid">
            <div className="lp-fbrand">
              <Link className="lp-brand" to="/" style={{ color: '#f8f7f4', marginBottom: 14 }}>
                <img src={logoUrl} alt="VentureBridge" width="28" height="28" decoding="async" style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: '50%' }} /> venturebridge
              </Link>
              <p>Discovery and introductions for Indian founders and investors. Bengaluru · Mumbai. Operated by VentureBridge Technologies Pvt. Ltd.</p>
            </div>
            <div><h3>Product</h3><ul><li><a href="#how">How it works</a></li><li><a href="#matching">Matching</a></li><li><a href="#security">Security</a></li><li><Link to="/auth/register">Create profile</Link></li></ul></div>
            <div><h3>Founders</h3><ul><li><Link to="/auth/register">List your startup</Link></li><li><a href="#product">Shortlists</a></li><li><a href="#faq">Verification</a></li></ul></div>
            <div><h3>Investors</h3><ul><li><Link to="/auth/register">Set thesis</Link></li><li><a href="#product">Pipeline</a></li><li><a href="#faq">Pricing</a></li></ul></div>
            <div><h3>Company</h3><ul><li><Link to="/auth/login">Sign in</Link></li><li><a href="#faq">Contact</a></li><li><a href="#security">Privacy & terms</a></li></ul></div>
          </div>
          <div className="lp-fbottom">
            <span>© {new Date().getFullYear()} VentureBridge Technologies Pvt. Ltd.</span>
            <span className="spacer" />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span className="lp-dot" /> All systems operational</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
