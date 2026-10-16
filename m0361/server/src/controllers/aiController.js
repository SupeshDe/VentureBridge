import Startup from '../models/Startup.js'
import Connection from '../models/Connection.js'
import { analyzeStartup } from '../services/aiAnalysisService.js'
import { env } from '../config/env.js'

const GEMINI_MODEL = env.geminiModel
const FALLBACK_GEMINI_MODEL = 'gemini-3.6-flash'
const OUTPUT_TOKEN_BUDGETS = [1200, 2048, 3072]
const SYSTEM_PROMPT = [
  'You are VentureBridge Assistant, the in-app helper for a founder–investor discovery platform.',
  'You help users complete profiles, understand match scores (industry 30, range 25, stage 15, risk/location/equity 10 each), and use discovery, requests, connections and chat.',
  'Rules: never give financial, legal or investment advice; never promise funding; keep replies under 120 words; be concrete and cite platform features.',
].join(' ')

export function buildGeminiContents(messages) {
  if (!Array.isArray(messages)) return []

  const contents = messages
    .filter(message =>
      message &&
      (message.role === 'user' || message.role === 'assistant') &&
      typeof message.text === 'string' &&
      message.text.trim()
    )
    .map(message => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      text: message.text.trim().slice(0, 1000),
    }))
    .slice(-10)

  while (contents[0]?.role === 'model') contents.shift()

  const turns = []
  for (const content of contents) {
    const previous = turns[turns.length - 1]
    if (previous?.role === content.role) previous.text += `\n${content.text}`
    else turns.push({ ...content })
  }

  return turns.map(({ role, text }) => ({
    role,
    parts: [{ text }],
  }))
}

/**
 * AI-style startup analysis. Visible to the owner, connected
 * counterparties and admins.
 */
export async function getStartupAnalysis(req, res, next) {
  try {
    const startup = await Startup.findById(req.params.id).select('owner').lean()
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup not found' })
    }

    const isOwner = startup.owner.toString() === req.user._id.toString()
    const isAdmin = req.user.role === 'admin'
    let connected = false
    if (!isOwner && !isAdmin) {
      connected = await Connection.exists({
        $or: [{ entrepreneur: req.user._id }, { investor: req.user._id }],
        startup: startup._id,
        status: 'active',
      })
      if (!connected) {
        return res.status(403).json({ success: false, message: 'Analysis is available to the owner and connected parties' })
      }
    }

    const analysis = await analyzeStartup(req.params.id)
    res.json({ success: true, data: analysis })
  } catch (error) {
    next(error)
  }
}

/**
 * Gemini-backed assistant chat. API key stays server-side.
 * Body: { messages: [{ role: 'user'|'assistant', text: string }] }
 */
export async function askAssistant(req, res, next) {
  try {
    const apiKey = env.geminiApiKey
    if (!apiKey) {
      return res.status(503).json({
        success: false,
        message: 'AI assistant is not configured yet. Set GEMINI_API_KEY on the server to enable it.',
      })
    }

    const { messages } = req.body || {}
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: 'Provide at least one message' })
    }

    const contents = buildGeminiContents(messages)
    if (!contents.length || contents[contents.length - 1].role !== 'user') {
      return res.status(400).json({ success: false, message: 'The last message must be from you' })
    }

    let reply = ''
    const requestBody = {
      system_instruction: { parts: [{ text: `${SYSTEM_PROMPT} The user is a ${req.user.role} named ${req.user.name || 'there'}.` }] },
      contents,
      generationConfig: { maxOutputTokens: OUTPUT_TOKEN_BUDGETS[0], temperature: 0.7 },
    }

    let model = GEMINI_MODEL
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 25000)
      let retryDelay = 500
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify(requestBody),
          }
        )
        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          const error = new Error(data?.error?.message || `Gemini request failed (${response.status})`)
          error.statusCode = response.status === 429 ? 429 : 502
          error.upstreamStatusCode = response.status
          error.retryable = response.status === 429 || response.status >= 500
          const retryAfter = Number(response.headers?.get('retry-after'))
          if (Number.isFinite(retryAfter) && retryAfter > 0) {
            retryDelay = Math.min(retryAfter * 1000, 2000)
          }
          throw error
        }
        const candidate = data?.candidates?.[0]
        reply = candidate?.content?.parts?.map(part => part.text || '').join('').trim()
        if (candidate?.finishReason === 'MAX_TOKENS') {
          if (attempt === OUTPUT_TOKEN_BUDGETS.length - 1) {
            const error = new Error('The assistant could not finish its reply. Please try asking a shorter question.')
            error.statusCode = 502
            error.retryable = false
            throw error
          }
          requestBody.generationConfig.maxOutputTokens = OUTPUT_TOKEN_BUDGETS[attempt + 1]
          reply = ''
          continue
        }
        break
      } catch (error) {
        if (error.upstreamStatusCode === 404 && model !== FALLBACK_GEMINI_MODEL) {
          model = FALLBACK_GEMINI_MODEL
          continue
        }
        if (error.name === 'AbortError') {
          error.message = 'The assistant request timed out. Please try again.'
          error.statusCode = 504
          error.retryable = false
        } else if (!error.statusCode) {
          error.statusCode = 502
          error.retryable = true
        }
        if (!error.retryable || attempt === 2) throw error
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      } finally {
        clearTimeout(timeout)
      }
    }

    if (!reply) {
      return res.status(502).json({ success: false, message: 'The assistant returned an empty reply — try again' })
    }
    res.json({ success: true, data: { reply } })
  } catch (error) {
    next(error)
  }
}
