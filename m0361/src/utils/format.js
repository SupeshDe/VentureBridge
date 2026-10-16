export function formatCurrency(amount, currency = 'INR') {
  if (amount == null) return '—'
  try {
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
  } catch { return `${currency} ${Number(amount).toLocaleString('en-IN')}` }
}
export function formatLakhs(amount) {
  if (amount == null || amount === '') return '—'
  const value = Number(amount)
  if (!Number.isFinite(value)) return '—'
  if (value >= 10000000) {
    return `₹${(value / 10000000).toLocaleString('en-IN', { maximumFractionDigits: 2 })}Cr`
  }
  const lakhs = Math.min(value / 100000, 99.99)
  return `₹${lakhs.toLocaleString('en-IN', { maximumFractionDigits: value >= 1000000 ? 2 : 0 })}L`
}
export function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
}
export function getGreeting(hour = new Date().getHours()) {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
export function formatRelative(date) {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff/60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins/60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs/24)
  if (days < 7) return `${days}d ago`
  return formatDate(date)
}
export function initials(name='') { return name.split(' ').filter(Boolean).slice(0,2).map(n=>n[0].toUpperCase()).join('') || 'VB' }
export function truncate(str, n=80) { return str && str.length>n ? str.slice(0,n)+'…' : str }
