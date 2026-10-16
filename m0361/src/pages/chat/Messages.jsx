import React, { useEffect, useState, useRef } from 'react'
import api from '../../services/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Send, MessageCircle, Users, Paperclip, FileText } from 'lucide-react'
import { useSocket } from '../../hooks/useSocket'
import { useAuth } from '../../context/AuthContext'

function idOf(value) {
  return String(value?._id || value?.id || value || '')
}

function otherParticipant(conversation, currentUser) {
  const currentUserId = idOf(currentUser)
  return (
    conversation?.participants?.find(participant => idOf(participant) !== currentUserId) ||
    conversation?.participants?.[0]
  )
}

function mergeMessages(current, incoming) {
  const messagesById = new Map(current.map(message => [idOf(message), message]))
  incoming.forEach(message => messagesById.set(idOf(message), message))
  return [...messagesById.values()].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
}

function connectionColor(connectionId) {
  let hash = 0
  for (const character of String(connectionId)) {
    hash = (hash * 31 + character.charCodeAt(0)) % 360
  }
  return {
    background: `hsl(${hash} 78% 82%)`,
    foreground: `hsl(${hash} 72% 22%)`,
    accent: `hsl(${hash} 78% 36%)`,
  }
}

function Avatar({ participant, size = 'w-10 h-10', color }) {
  const name = participant?.name || 'User'
  return participant?.profileImage ? (
    <img
      src={participant.profileImage}
      alt=""
      className={`${size} rounded-full object-cover`}
      style={{ boxShadow: `0 0 0 2px ${color?.accent || '#288967'}` }}
    />
  ) : (
    <div
      className={`${size} rounded-full grid place-items-center text-xs font-bold`}
      style={{
        backgroundColor: color?.background || '#d1fae5',
        color: color?.foreground || '#065f46',
        boxShadow: `0 0 0 2px ${color?.accent || '#059669'}`,
      }}
      aria-label={name}
    >
      {name
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part[0])
        .join('')
        .toUpperCase()}
    </div>
  )
}

export default function Messages() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [active, setActive] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [attaching, setAttaching] = useState(false)
  const [loading, setLoading] = useState(true)
  const [chatError, setChatError] = useState('')
  const endRef = useRef(null)
  const fileRef = useRef(null)
  const activeId = idOf(active)
  const { socket, connected } = useSocket(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.getConversations()
        if (cancelled) return
        setConversations(res.data || [])
        if (res.data?.length) setActive(res.data[0])
      } catch (error) {
        if (!cancelled) setChatError(error.message || 'Could not load conversations.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!activeId) {
      setMessages([])
      return undefined
    }
    let cancelled = false
    const joinConversation = () => socket?.emit('conversation:join', activeId)
    joinConversation()
    socket?.on('connect', joinConversation)
    setMessages([])
    setChatError('')

    ;(async () => {
      try {
        const res = await api.getConversation(activeId)
        if (cancelled) return
        setMessages(current => mergeMessages(current, res.data?.messages || []))
        await api.markMessagesAsRead(activeId).catch(() => {})
      } catch (error) {
        if (!cancelled) setChatError(error.message || 'Could not load this conversation.')
      }
    })()

    return () => {
      cancelled = true
      socket?.off('connect', joinConversation)
      socket?.emit('conversation:leave', activeId)
    }
  }, [activeId, socket])

  useEffect(() => {
    if (!socket || !activeId) return undefined
    const onNew = message => {
      if (idOf(message.conversation) !== activeId) return
      setMessages(current => mergeMessages(current, [message]))
      setConversations(current =>
        current.map(conversation =>
          idOf(conversation) === activeId
            ? { ...conversation, lastMessage: message, lastMessageAt: message.createdAt }
            : conversation
        )
      )
    }
    socket.on('message:new', onNew)
    return () => socket.off('message:new', onNew)
  }, [socket, activeId])

  useEffect(() => {
    if (connected || !activeId) return undefined
    let cancelled = false
    const refreshMessages = async () => {
      try {
        const res = await api.getConversation(activeId)
        if (cancelled) return
        setMessages(current => mergeMessages(current, res.data?.messages || []))
      } catch (error) {
        if (!cancelled) setChatError(error.message || 'Could not refresh messages.')
      }
    }
    const interval = window.setInterval(refreshMessages, 4000)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [connected, activeId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(attachment) {
    const body = (text || '').trim()
    if ((!body && !attachment) || !activeId) return
    setChatError('')
    const payload = {
      conversationId: activeId,
      message: body || (attachment ? `Shared a document: ${attachment.name}` : ''),
    }
    if (attachment) {
      payload.attachment = attachment.url
      payload.attachmentType = attachment.kind
    }
    setText('')

    if (socket?.connected) {
      socket.emit('message:send', payload, result => {
        if (result?.success && result.data) {
          setMessages(current => mergeMessages(current, [result.data]))
        } else {
          setText(body)
          setChatError(result?.message || 'Message could not be sent. Please try again.')
        }
      })
      return
    }

    try {
      const result = await api.sendMessage(payload)
      if (result.data) setMessages(current => mergeMessages(current, [result.data]))
      setConversations(current =>
        current.map(conversation =>
          idOf(conversation) === activeId
            ? { ...conversation, lastMessage: result.data, lastMessageAt: result.data?.createdAt }
            : conversation
        )
      )
    } catch (error) {
      setText(body)
      setChatError(error.message || 'Message could not be sent. Please try again.')
    }
  }

  async function attach(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !activeId) return
    setAttaching(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('category', 'other')
      fd.append('visibility', 'connections')
      fd.append('description', 'Shared in chat')
      const up = await api.uploadDocument(fd)
      const kind = (up.data?.fileType === 'pdf' && 'document') || 'other'
      await send({ url: up.data?.fileUrl, name: up.data?.fileName, kind })
    } catch (error) {
      setChatError(error.message || 'Attachment failed.')
    } finally {
      setAttaching(false)
    }
  }

  if (loading)
    return (
      <div className="page-wrap">
        <div className="py-16 text-center text-sm text-[#0057ff]">Loading…</div>
      </div>
    )

  return (
    <div className="page-wrap">
      <h1 className="text-2xl font-bold text-emerald-800 mb-4">Messages</h1>
      {chatError && (
        <p
          role="alert"
          className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {chatError}
        </p>
      )}
      <div className="grid lg:grid-cols-[320px_1fr] gap-4 min-h-[540px]">
        <Card padding={false} className="overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-emerald-200 font-semibold text-sm text-emerald-900 flex items-center gap-2">
            <Users size={16} /> Conversations
          </div>
          <div className="flex-1 overflow-auto divide-y divide-emerald-100">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-sm text-emerald-800">No conversations yet</div>
            ) : (
              conversations.map(conversation => {
                const participant = otherParticipant(conversation, user)
                const selected = activeId === idOf(conversation)
                const color = connectionColor(idOf(conversation))
                return (
                  <button
                    key={conversation._id}
                    onClick={() => setActive(conversation)}
                    className="conversation-hover-card w-full text-left px-4 py-3 flex gap-3 transition-colors"
                    style={{
                      backgroundColor: selected ? '#29ac68' : '#ac2525',
                      borderLeft: `4px solid ${color.accent}`,
                    }}
                  >
                    <Avatar participant={participant} size="w-10 h-10" color={color} />
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ color: '#0f172a', opacity: 1 }}
                      >
                        {participant?.name || 'Conversation'}
                      </p>
                      <p className="text-xs truncate" style={{ color: '#334155', opacity: 1 }}>
                        {conversation.lastMessage?.message || 'No messages yet'}
                      </p>
                    </div>
                    {conversation.unreadCount && (
                      <span
                        className="w-2 h-2 rounded-full self-center"
                        style={{ backgroundColor: color.accent }}
                      />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </Card>

        <Card
          padding={false}
          className="flex flex-col overflow-hidden rounded-2xl border border-emerald-100"
        >
          {!active ? (
            <div className="flex-1 grid place-items-center p-10 text-center text-sm text-emerald-800">
              <div>
                <MessageCircle size={28} className="mx-auto mb-2 text-emerald-700" />
                <p>Select a conversation</p>
              </div>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-emerald-100 flex items-center gap-3">
                <Avatar
                  participant={otherParticipant(active, user)}
                  size="w-10 h-10"
                  color={connectionColor(activeId)}
                />
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {otherParticipant(active, user)?.name || 'Conversation'}
                  </p>
                  <p className="text-xs text-emerald-700">Connected</p>
                </div>
                <span
                  className={`ml-auto flex items-center gap-1.5 text-xs ${connected ? 'text-emerald-700' : 'text-slate-400'}`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  />
                  {connected ? 'Live' : 'Reconnecting'}
                </span>
              </div>
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  background: '#f8faf9',
                }}
              >
                {messages.map(message => {
                  const mine = idOf(message.sender) === idOf(user)
                  return (
                    <div
                      key={idOf(message)}
                      style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}
                    >
                      <div
                        style={{
                          maxWidth: 'min(78%, 520px)',
                          padding: '11px 15px',
                          fontSize: 14,
                          lineHeight: 1.55,
                          color: mine ? '#ffffff' : '#14532d',
                          background: mine ? '#15803d' : '#ecfdf3',
                          border: mine ? '1px solid #15803d' : '1px solid #bbf7d0',
                          borderRadius: 18,
                          borderBottomRightRadius: mine ? 5 : 18,
                          borderBottomLeftRadius: mine ? 18 : 5,
                          boxShadow: '0 2px 8px rgba(20,83,45,.08)',
                        }}
                      >
                        <p style={{ margin: 0, overflowWrap: 'anywhere' }}>{message.message}</p>
                        {message.attachment && (
                          <a
                            href={message.attachment}
                            download
                            style={{
                              marginTop: 6,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              fontSize: 12,
                              fontWeight: 700,
                              color: mine ? '#f0fdf4' : '#166534',
                            }}
                          >
                            <FileText size={13} /> Open attachment
                          </a>
                        )}
                        <p
                          style={{
                            margin: '5px 0 0',
                            fontSize: 11,
                            textAlign: 'right',
                            color: mine ? 'rgba(255,255,255,.82)' : '#4b7c5b',
                          }}
                        >
                          {mine ? 'You' : message.sender?.name || 'User'} ·{' '}
                          {new Date(message.createdAt || Date.now()).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })}
                {messages.length === 0 && (
                  <div className="text-center text-xs text-slate-500 py-10">
                    No messages yet. Say hello!
                  </div>
                )}
                <div ref={endRef} />
              </div>
              <div className="p-3 border-t border-emerald-100 flex gap-2 bg-white">
                <input
                  value={text}
                  onChange={event => setText(event.target.value)}
                  onKeyDown={event => event.key === 'Enter' && send()}
                  placeholder="Type a message…"
                  className="flex-1 rounded-xl border border-emerald-200 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
                />
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
                  onChange={attach}
                  style={{ display: 'none' }}
                />
                <Button
                  variant="secondary"
                  className="!bg-emerald-50 !text-emerald-800 hover:!bg-emerald-100"
                  onClick={() => fileRef.current?.click()}
                  loading={attaching}
                  title="Attach a document"
                >
                  <Paperclip size={16} />
                </Button>
                <Button
                  className="!bg-emerald-700 !text-white hover:!bg-emerald-800"
                  onClick={() => send()}
                  disabled={!text.trim()}
                >
                  <Send size={16} /> Send
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
