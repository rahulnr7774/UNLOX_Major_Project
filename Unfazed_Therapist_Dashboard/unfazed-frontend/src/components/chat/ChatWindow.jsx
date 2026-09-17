import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import MessageBubble from './MessageBubble'
import { useAuth } from '../../context/AuthContext'

function formatTime(value) {
  return new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export default function ChatWindow({ conversationId, onSessionDetails, onSessionEnded, readOnly = false }) {
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [typingName, setTypingName] = useState('')
  const socketRef = useRef(null)
  const typingTimer = useRef(null)
  const sessionDetailsRef = useRef(onSessionDetails)
  const sessionEndedRef = useRef(onSessionEnded)
  const { user } = useAuth()

  useEffect(() => { sessionDetailsRef.current = onSessionDetails }, [onSessionDetails])
  useEffect(() => { sessionEndedRef.current = onSessionEnded }, [onSessionEnded])

  useEffect(() => {
    const configuredSocketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    const socketUrl = configuredSocketUrl.match(/^https?:\/\//) ? configuredSocketUrl : `https://${configuredSocketUrl}`
    const parsedSocketUrl = new URL(socketUrl)
    if (!['localhost', '127.0.0.1'].includes(parsedSocketUrl.hostname) && parsedSocketUrl.port === '5000') parsedSocketUrl.port = ''
    const socket = io(parsedSocketUrl.toString(), { transports: ['websocket'], auth: { token: localStorage.getItem('unfazed_token') } })
    socketRef.current = socket
    socket.on('connect', () => socket.emit('chat:join', conversationId))
    socket.on('chat:history', (history) => {
      setMessages(history)
      history.filter((message) => String(message.receiver_id) === String(user?._id) && !message.read_at).forEach((message) => socket.emit('chat:read', { conversationId, messageId: message._id }))
    })
    socket.on('chat:message', (message) => {
      setMessages((current) => [...current, message])
      if (String(message.receiver_id) === String(user?._id)) socket.emit('chat:read', { conversationId, messageId: message._id })
    })
    socket.on('chat:typing', ({ userId, name, isTyping }) => setTypingName(isTyping && String(userId) !== String(user?._id) ? `${name} is typing...` : ''))
    socket.on('chat:read', ({ messageId, readAt }) => setMessages((current) => current.map((message) => message._id === messageId ? { ...message, read_at: readAt } : message)))
    socket.on('session:details', (details) => sessionDetailsRef.current?.(details))
    socket.on('session:ended', () => sessionEndedRef.current?.())
    return () => { socket.disconnect(); socketRef.current = null; window.clearTimeout(typingTimer.current) }
  }, [conversationId, user?._id])

  function handleDraftChange(event) {
    if (readOnly) return
    const value = event.target.value
    setDraft(value)
    socketRef.current?.emit('chat:typing', { conversationId, isTyping: Boolean(value.trim()) })
    window.clearTimeout(typingTimer.current)
    typingTimer.current = window.setTimeout(() => socketRef.current?.emit('chat:typing', { conversationId, isTyping: false }), 900)
  }

  function sendMessage(event) {
    event.preventDefault()
    if (readOnly) return
    const message = draft.trim()
    if (!message) return
    socketRef.current?.emit('chat:message', { conversationId, message })
    setDraft('')
    socketRef.current?.emit('chat:typing', { conversationId, isTyping: false })
  }

  return <div className="space-y-4"><div className="min-h-48 space-y-3">{messages.map((message) => { const own = String(message.sender_id) === String(user?._id); return <div key={message._id} className={own ? 'ml-auto max-w-xs text-right' : 'max-w-xs'}><p className="mb-1 text-[11px] font-semibold text-ink/45">{own ? `You -> ${message.receiver_name}` : `${message.sender_name} -> You`}</p><MessageBubble own={own}>{message.content}</MessageBubble><p className="mt-1 text-[11px] text-ink/40">{formatTime(message.sent_at)}{own && (message.read_at ? ' · Read' : ' · Sent')}</p></div> })}{!messages.length && <p className="text-sm text-ink/45">{readOnly ? 'No messages were sent in this session.' : 'You are connected. Start the conversation.'}</p>}</div>{typingName && !readOnly && <p className="text-xs font-semibold text-moss">{typingName}</p>}{readOnly ? <p className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-ink/45">This session has ended. You can still view the conversation.</p> : <form onSubmit={sendMessage} className="flex gap-2"><input value={draft} onChange={handleDraftChange} placeholder="Write a message..." className="min-w-0 flex-1 rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-moss" /><button className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-moss">Send</button></form>}</div>
}
