export function success(res, data, message = 'Success', meta = {}) {
  const payload = { success: true, message, data }
  if (Object.keys(meta).length) payload.meta = meta
  // requestId if set by middleware
  if (res.locals?.requestId) payload.requestId = res.locals.requestId
  return res.json(payload)
}
export function created(res, data, message = 'Created') {
  return res.status(201).json({ success: true, message, data, requestId: res.locals?.requestId })
}
export function paginated(res, data, pagination, message = 'Success') {
  return res.json({ success: true, message, data, pagination, requestId: res.locals?.requestId })
}
