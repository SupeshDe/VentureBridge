import React from 'react'
import { Star } from 'lucide-react'

/**
 * Read-only star display: ★ 4.2 (6)
 */
export function Stars({ value = 0, count = null, size = 14 }) {
  if (!count) return null
  const full = Math.round(Number(value) || 0)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }} title={`${value} out of 5 from ${count} review${count === 1 ? '' : 's'}`}>
      <span style={{ display: 'inline-flex', gap: 1 }} aria-hidden="true">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            size={size}
            color={i <= full ? '#F5B82E' : 'rgba(0,87,255,.3)'}
            fill={i <= full ? '#F5B82E' : 'none'}
            strokeWidth={2}
          />
        ))}
      </span>
      <b style={{ fontSize: 12, color: '#0057ff' }}>{Number(value).toFixed(1)}</b>
      <span style={{ fontSize: 11, color: '#0057ff', opacity: .65 }}>({count})</span>
    </span>
  )
}

/**
 * Fetched review list + summary for a user id.
 * Pass the api service (avoids a circular import).
 */
export function ReviewsBlock({ userId, api }) {
  const [data, setData] = React.useState(null)
  React.useEffect(() => {
    let live = true
    setData(null)
    if (!userId || !api) return () => { live = false }
    api.getUserReviews(userId).then(r => { if (live) setData(r.data) }).catch(() => { if (live) setData({ summary: { avg: 0, count: 0 }, reviews: [] }) })
    return () => { live = false }
  }, [userId])
  if (data === null) return <p className="text-xs text-[#0057ff]">Loading reviews…</p>
  if (!data.summary?.count) return <p className="text-xs text-[#0057ff]" style={{ opacity: .7 }}>No reviews yet — ratings appear after connections.</p>
  return (
    <div className="grid gap-2">
      <Stars value={data.summary.avg} count={data.summary.count} size={16} />
      {(data.reviews || []).slice(0, 3).map(r => (
        <div key={r._id} style={{ border: '1px solid rgba(0,87,255,.25)', padding: '8px 10px' }}>
          <div className="flex items-center gap-2 mb-1">
            <Stars value={r.stars} count={1} size={11} />
            <span className="text-xs font-semibold text-[#0057ff]">{r.reviewer?.name || 'A connection'}</span>
          </div>
          {r.text && <p className="text-xs text-[#0057ff]" style={{ margin: 0, lineHeight: 1.55 }}>{r.text}</p>}
        </div>
      ))}
    </div>
  )
}
export function StarInput({ value = 0, onChange, size = 26 }) {
  const [hover, setHover] = React.useState(0)
  const shown = hover || value
  return (
    <div role="radiogroup" aria-label="Star rating" style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} star${i === 1 ? '' : 's'}`}
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          style={{ background: 'none', border: 0, cursor: 'pointer', padding: 2, lineHeight: 0 }}
        >
          <Star
            size={size}
            color={i <= shown ? '#F5B82E' : 'rgba(0,87,255,.35)'}
            fill={i <= shown ? '#F5B82E' : 'none'}
            strokeWidth={2}
          />
        </button>
      ))}
    </div>
  )
}
