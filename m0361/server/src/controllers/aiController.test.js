import { describe, expect, it, vi } from 'vitest'

vi.mock('../models/Startup.js', () => ({ default: { findById: vi.fn() } }))
vi.mock('../models/Connection.js', () => ({ default: { exists: vi.fn() } }))
vi.mock('../services/aiAnalysisService.js', () => ({ analyzeStartup: vi.fn() }))

import { buildGeminiContents } from './aiController.js'

describe('buildGeminiContents', () => {
  it('drops the assistant greeting so the first Gemini turn is from the user', () => {
    expect(buildGeminiContents([
      { role: 'assistant', text: 'Welcome' },
      { role: 'user', text: 'How do matches work?' },
    ])).toEqual([
      { role: 'user', parts: [{ text: 'How do matches work?' }] },
    ])
  })

  it('drops a leading assistant turn when the history limit cuts into a conversation', () => {
    const messages = [
      { role: 'user', text: 'Earlier question' },
      { role: 'assistant', text: 'Earlier answer' },
      ...Array.from({ length: 8 }, (_, index) => [
        { role: 'user', text: `Question ${index}` },
        { role: 'assistant', text: `Answer ${index}` },
      ]).flat(),
      { role: 'user', text: 'Latest question' },
    ]

    const contents = buildGeminiContents(messages)

    expect(contents.length).toBeLessThanOrEqual(10)
    expect(contents[0].role).toBe('user')
    expect(contents.at(-1).role).toBe('user')
    expect(contents.every((turn, index) => index === 0 || turn.role !== contents[index - 1].role)).toBe(true)
  })

  it('ignores invalid messages and combines consecutive turns with the same role', () => {
    expect(buildGeminiContents([
      { role: 'system', text: 'Ignore this' },
      { role: 'user', text: 'First part' },
      { role: 'user', text: 'Second part' },
    ])).toEqual([
      { role: 'user', parts: [{ text: 'First part\nSecond part' }] },
    ])
  })

  it('falls back to the supported model when a configured model has been retired', async () => {
    vi.resetModules()
    vi.stubEnv('GEMINI_API_KEY', 'test-key')
    vi.stubEnv('GEMINI_MODEL', 'retired-model')
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: { get: () => null },
        json: async () => ({ error: { message: 'Model not found' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: async () => ({ candidates: [{ content: { parts: [{ text: 'Hello' }] } }] }),
      })
    vi.stubGlobal('fetch', fetchMock)

    try {
      const { askAssistant } = await import('./aiController.js')
      const res = { json: vi.fn() }
      const next = vi.fn()

      await askAssistant({
        body: { messages: [{ role: 'user', text: 'Hi' }] },
        user: { role: 'entrepreneur', name: 'Founder' },
      }, res, next)

      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(fetchMock.mock.calls[0][0]).toContain('/models/retired-model:')
      expect(fetchMock.mock.calls[1][0]).toContain('/models/gemini-3.6-flash:')
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { reply: 'Hello' } })
      expect(next).not.toHaveBeenCalled()
    } finally {
      vi.unstubAllGlobals()
      vi.unstubAllEnvs()
      vi.resetModules()
    }
  })

  it('retries truncated generations with a larger token budget', async () => {
    vi.resetModules()
    vi.stubEnv('GEMINI_API_KEY', 'test-key')
    vi.stubEnv('GEMINI_MODEL', 'gemini-3.6-flash')
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: async () => ({
          candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: 'To improve your profile,' }] } }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: async () => ({
          candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'Add a clear pitch deck and complete your traction metrics.' }] } }],
        }),
      })
    vi.stubGlobal('fetch', fetchMock)

    try {
      const { askAssistant } = await import('./aiController.js')
      const res = { json: vi.fn() }
      const next = vi.fn()

      await askAssistant({
        body: { messages: [{ role: 'user', text: 'How do I improve my profile?' }] },
        user: { role: 'entrepreneur', name: 'Founder' },
      }, res, next)

      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(JSON.parse(fetchMock.mock.calls[0][1].body).generationConfig.maxOutputTokens).toBe(1200)
      expect(JSON.parse(fetchMock.mock.calls[1][1].body).generationConfig.maxOutputTokens).toBe(2048)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { reply: 'Add a clear pitch deck and complete your traction metrics.' },
      })
      expect(next).not.toHaveBeenCalled()
    } finally {
      vi.unstubAllGlobals()
      vi.unstubAllEnvs()
      vi.resetModules()
    }
  })
})
