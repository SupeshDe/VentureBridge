import logger from '../utils/logger.js'
import { duplicateKeyFields, isDuplicateKeyError } from '../utils/mongoErrors.js'

export function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}`, requestId: req.id })
}

export function errorHandler(error, req, res, _next) {
  const duplicateKeyError = isDuplicateKeyError(error)
  const status = error.statusCode || error.status || (duplicateKeyError ? 409 : 500)
  const isOperational = duplicateKeyError || error.isOperational || status < 500

  if (!isOperational) logger.error('Unhandled error', { message: error.message, stack: error.stack, path: req.originalUrl, requestId: req.id })
  else logger.warn('Operational error', { message: error.message, status, path: req.originalUrl })

  // Mongoose validation
  if (error.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: 'Validation failed', details: Object.values(error.errors).map(e => e.message), requestId: req.id })
  }
  if (duplicateKeyError) {
    const fields = duplicateKeyFields(error)
    return res.status(409).json({
      success: false,
      message: fields.length ? `A record with this ${fields.join(', ')} already exists` : 'A duplicate record already exists',
      requestId: req.id,
    })
  }
  if (error.name === 'CastError') {
    return res.status(400).json({ success: false, message: `Invalid ${error.path}: ${error.value}`, requestId: req.id })
  }

  const message = process.env.NODE_ENV === 'production' && status === 500 ? 'Something went wrong' : error.message
  res.status(status).json({ success: false, message, ...(error.details ? { details: error.details } : {}), requestId: req.id })
}
