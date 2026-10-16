import crypto from 'crypto'

// mongo sanitize without dep — remove keys starting with $ or containing .
export function mongoSanitize(req, _res, next) {
  function sanitize(obj) {
    if (!obj || typeof obj !== 'object') return
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key]
        continue
      }
      const val = obj[key]
      if (val && typeof val === 'object') sanitize(val)
    }
  }
  if (req.body) sanitize(req.body)
  if (req.query) sanitize(req.query)
  if (req.params) sanitize(req.params)
  next()
}

export function hpp(req, _res, next) {
  // keep first value if array (protection against ?sort=...&sort=...)
  for (const [k, v] of Object.entries(req.query)) {
    if (Array.isArray(v)) req.query[k] = v[0]
  }
  next()
}

export function noCache(_req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  next()
}

export function requestLogger(req, _res, next) {
  req.id = req.id || crypto.randomUUID()
  next()
}
