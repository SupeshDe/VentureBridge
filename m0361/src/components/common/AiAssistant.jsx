import React, { useEffect, useRef, useState } from 'react'
import { Sparkles, X, Send } from 'lucide-react'
import api from '../../services/api'

const SUGGESTIONS = [
  'How is my match score calculated?',
  'How do I improve my profile?',
  'How do requests and connections work?',
]

export default function AiAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I can help with profiles, match scores and getting connected. What do you need?' },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const bodyRef = useRef(null)

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight })
  }, [messages, open])

  async function send(text) {
    const clean = (text ?? input).trim()
    if (!clean || busy) return
    const next = [...messages, { role: 'user', text: clean }]
    setMessages(next)
    setInput('')
    setBusy(true)
    try {
      const res = await api.askAi(next.filter(m => m.role !== 'system').map(m => ({ role: m.role, text: m.text })))
      setMessages([...next, { role: 'assistant', text: res.data?.reply || 'Sorry, I could not answer that.' }])
    } catch (e) {
      setMessages([...next, { role: 'assistant', text: e.message || 'Assistant is unavailable right now.' }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close AI assistant' : 'Open AI assistant'}
        aria-expanded={open}
        title="Ask the AI assistant"
        style={{
          position: 'fixed', right: 22, bottom: 22, zIndex: 60,
          width: 54, height: 54, background: '#FF9933', color: '#1c2b4a',
          border: '1px solid #FF9933', cursor: 'pointer',
          display: 'grid', placeItems: 'center',
          boxShadow: '0 14px 30px -12px rgba(0,20,60,.55)',
        }}
      >
        {open ? <X size={22} /> : <Sparkles size={22} />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="AI assistant"
          style={{
            position: 'fixed', right: 22, bottom: 88, zIndex: 60,
            width: 'min(360px, calc(100vw - 44px))', height: 460, maxHeight: '60vh',
            background: '#FFD60A', border: '1px solid #1c2b4a',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 24px 50px -18px rgba(0,20,60,.5)',
          }}
        >
          <div style={{ background: '#1c2b4a', color: '#FFD60A', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} />
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>Assistant</p>
              <p style={{ margin: 0, fontSize: 11, opacity: .75 }}>Powered by Gemini · not financial advice</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 0, color: '#FFD60A', cursor: 'pointer', padding: 4 }}>
              <X size={16} />
            </button>
          </div>

          <div ref={bodyRef} style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%', padding: '9px 12px', fontSize: 13, lineHeight: 1.55, whiteSpace: 'pre-wrap',
                  color: m.role === 'user' ? '#f8f7f4' : '#1c2b4a',
                  background: m.role === 'user' ? '#0057ff' : '#ffffff',
                  border: m.role === 'user' ? '1px solid #0057ff' : '1px solid #1c2b4a',
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {busy && <p style={{ margin: 0, fontSize: 12, color: '#1c2b4a', opacity: .7 }}>Thinking…</p>}
            {messages.length === 1 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => send(s)} style={{ fontSize: 12, fontWeight: 600, color: '#1c2b4a', background: '#ffffff', border: '1px solid #1c2b4a', padding: '6px 10px', cursor: 'pointer' }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ padding: 10, borderTop: '1px solid #1c2b4a', display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') send() }}
              placeholder="Ask anything…"
              maxLength={1000}
              style={{ flex: 1, minWidth: 0, border: '1px solid #1c2b4a', padding: '9px 11px', fontSize: 13, outline: 'none', background: '#ffffff', color: '#1c2b4a' }}
            />
            <button onClick={() => send()} disabled={busy || !input.trim()} aria-label="Send" style={{ background: '#1c2b4a', color: '#FFD60A', border: '1px solid #1c2b4a', padding: '0 13px', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
