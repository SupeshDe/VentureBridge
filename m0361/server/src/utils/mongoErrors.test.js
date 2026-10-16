import { describe, expect, it, vi } from 'vitest'
import { duplicateKeyFields, isDuplicateKeyError } from './mongoErrors.js'

describe('MongoDB duplicate-key detection', () => {
  it('detects standard Mongo duplicate-key errors', () => {
    expect(isDuplicateKeyError({ code: 11000, keyPattern: { email: 1 } })).toBe(true)
    expect(duplicateKeyFields({ code: 11000, keyPattern: { email: 1 } })).toEqual(['email'])
  })

  it('detects duplicate errors nested in bulk write errors', () => {
    const error = {
      writeErrors: [{ err: { code: 11001, keyValue: { slug: 'same-slug' } } }],
    }

    expect(isDuplicateKeyError(error)).toBe(true)
    expect(duplicateKeyFields(error)).toEqual(['slug'])
  })

  it('detects duplicate-key errors when surfaced by message only', () => {
    expect(isDuplicateKeyError(new Error('E11000 duplicate key error collection'))).toBe(true)
    expect(isDuplicateKeyError(new Error('connection timed out'))).toBe(false)
  })

  it('returns a safe conflict response without exposing the duplicate value', async () => {
    const { errorHandler } = await import('../middleware/errorMiddleware.js')
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }

    errorHandler(
      { code: 11000, keyValue: { email: 'private@example.com' } },
      { id: 'request-1', originalUrl: '/api/auth/register' },
      res,
      vi.fn()
    )

    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'A record with this email already exists',
      requestId: 'request-1',
    })
  })
})
