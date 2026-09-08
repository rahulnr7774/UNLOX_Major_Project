import { ArrowLeft, Clock3, MessageCircle, Square } from 'lucide-react'
import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import ChatWindow from '../components/chat/ChatWindow'
import axiosInstance from '../api/axiosInstance'

function formatRemaining(value) {
  const milliseconds = Number(value)
  if (!Number.isFinite(milliseconds)) return '00:00:00'
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

export default function ChatPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { sessionId } = useParams()
  const requestedSessionCode = new URLSearchParams(location.search).get('code')
  const { user } = useAuth()
  const [activeSession, setActiveSession] = useState(sessionId ? { _id: sessionId } : null)
  const [started, setStarted] = useState(user?.role === 'therapist')
  const [loading, setLoading] = useState(user?.role === 'client')
  const [error, setError] = useState('')
  const [endsAt, setEndsAt] = useState(null)
  const [remaining, setRemaining] = useState(null)
  const [ended, setEnded] = useState(false)
  const [ending, setEnding] = useState(false)
  const activeSessionId = activeSession?._id || sessionId
  const sessionCode = requestedSessionCode || activeSession?.session_code

  useEffect(() => {
    if (user?.role !== 'client' || sessionId) return undefined

    axiosInstance.get('/clients/portal')
      .then(({ data }) => {
        const nextSession = data.upcomingSession || data.sessions?.[0]
        if (!nextSession) {
          setError('You do not have a session available for chat yet.')
          return
        }
        setActiveSession(nextSession)
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.message || 'Unable to load your chat session.')
      })
      .finally(() => setLoading(false))

    return undefined
  }, [sessionId, user?.role])

  useEffect(() => {
    if (!endsAt || ended) return undefined
    const update = () => setRemaining(new Date(endsAt).getTime() - Date.now())
    update()
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [endsAt, ended])

  async function endSession() {
    if (!window.confirm('End this session now?')) return
    try {
      setEnding(true)
      await axiosInstance.post(`/scheduling/sessions/${activeSessionId}/end`)
      setEnded(true)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to end this session.')
    } finally {
      setEnding(false)
    }
  }

  useEffect(() => {
    if (user?.role !== 'client' || !activeSessionId) return undefined
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token: localStorage.getItem('unfazed_token') }
    })
    socket.on('connect', () => {
      setLoading(false)
      socket.emit('session:wait', activeSessionId)
    })
    socket.on('session:started', ({ endsAt: sessionEndsAt }) => {
      setStarted(true)
      if (sessionEndsAt) setEndsAt(sessionEndsAt)
    })
    socket.on('session:ended', () => {
      setLoading(false)
      setStarted(true)
      setEnded(true)
    })
    socket.on('chat:error', ({ message }) => {
      setLoading(false)
      setError(message)
    })
    socket.on('connect_error', () => {
      setLoading(false)
      setError('Unable to connect to the session server.')
    })
    return () => socket.disconnect()
  }, [activeSessionId, user?.role])

  return <main className="min-h-screen bg-cream px-5 py-8 text-ink sm:px-8 lg:py-12"><div className="mx-auto max-w-2xl"><button onClick={() => navigate(-1)} className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-ink/55 hover:text-ink"><ArrowLeft size={16} /> Back</button><div className="rounded-[28px] border border-ink/10 bg-white p-6 shadow-[0_20px_60px_rgba(31,41,36,.05)] sm:p-8"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sage text-moss"><MessageCircle size={21} /></div><div><p className="text-xs font-bold uppercase tracking-[.16em] text-moss">Private session chat</p><h1 className="font-display text-2xl font-semibold">Session conversation</h1></div></div><p className="mt-4 text-xs text-ink/45">Session: {sessionCode || activeSessionId || 'Not selected'}</p>{loading && <p className="mt-6 rounded-2xl bg-cream p-5 text-sm text-ink/60">Connecting to the session server...</p>}{error && <p className="mt-6 rounded-2xl bg-[#fae2d9] p-5 text-sm font-semibold text-[#9a4932]">{error}</p>}{!loading && !error && !started && <p className="mt-6 rounded-2xl bg-sage p-5 text-sm font-semibold text-moss">Please wait for the therapist to start the session. You will join automatically.</p>}{started && !error && <><div className="mt-6 flex flex-col justify-between gap-3 rounded-2xl bg-sage p-4 sm:flex-row sm:items-center"><p className="inline-flex items-center gap-2 text-sm font-bold text-moss"><Clock3 size={17} />{ended ? 'Session ended' : remaining === null ? 'Timer loading...' : remaining <= 0 ? 'Scheduled time is over' : `${formatRemaining(remaining)} remaining`}</p>{user?.role === 'therapist' && !ended && <button onClick={endSession} disabled={ending} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#9a4932] px-4 py-2.5 text-sm font-bold text-white hover:bg-ink disabled:opacity-50"><Square size={14} />{ending ? 'Ending...' : 'End session'}</button>}</div>{ended ? <p className="mt-4 rounded-2xl border border-ink/10 bg-cream p-5 text-sm font-semibold text-ink/60">This session has ended. The conversation is closed.</p> : <div className="mt-4 rounded-2xl bg-cream p-4"><ChatWindow key={`${activeSessionId}-${location.search}`} conversationId={activeSessionId} onSessionDetails={({ endsAt: sessionEndsAt }) => setEndsAt(sessionEndsAt)} onSessionEnded={() => setEnded(true)} /></div>}</>}</div></div></main>
}
