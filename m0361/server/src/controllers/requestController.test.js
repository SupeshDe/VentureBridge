import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  CollaborationRequest,
  Connection,
  Conversation,
  Startup,
  createNotification,
  notifyUser,
} = vi.hoisted(() => ({
  CollaborationRequest: { countDocuments: vi.fn() },
  Connection: {},
  Conversation: {},
  Startup: {},
  createNotification: vi.fn(),
  notifyUser: vi.fn(),
}))

vi.mock('../models/CollaborationRequest.js', () => ({ default: CollaborationRequest }))
vi.mock('../models/Connection.js', () => ({ default: Connection }))
vi.mock('../models/Conversation.js', () => ({ default: Conversation }))
vi.mock('../models/Startup.js', () => ({ default: Startup }))
vi.mock('../services/notificationService.js', () => ({ createNotification }))
vi.mock('../services/emailService.js', () => ({
  notifyUser,
  templates: {},
}))

const { getPendingRequestCount } = await import('./requestController.js')

describe('getPendingRequestCount', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns zero when the user has no pending received requests', async () => {
    CollaborationRequest.countDocuments.mockResolvedValue(0)
    const res = { json: vi.fn() }
    const next = vi.fn()

    await getPendingRequestCount({ user: { _id: 'user-1' } }, res, next)

    expect(CollaborationRequest.countDocuments).toHaveBeenCalledWith({
      receiver: 'user-1',
      status: 'pending',
    })
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { pendingCount: 0 },
    })
    expect(next).not.toHaveBeenCalled()
  })
})
