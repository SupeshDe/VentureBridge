import crypto from 'crypto'
export function requestId(req, _res, next) {
  req.id = req.headers['x-request-id'] || crypto.randomUUID()
  next()
}
