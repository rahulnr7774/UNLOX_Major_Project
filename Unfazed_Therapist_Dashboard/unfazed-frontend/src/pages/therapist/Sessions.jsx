import { useEffect, useState } from 'react'
import { CalendarDays, Clock3, MessageCircle, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../api/axiosInstance'

export default function Sessions() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [startingId, setStartingId] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [bufferTime, setBufferTime] = useState(0)
  const [savingBuffer, setSavingBuffer] = useState(false)

  async function loadSessions() {
    const { data } = await axiosInstance.get('/scheduling/sessions', { params: { _: Date.now() } })
    setSessions(data.sessions || [])
  }

  async function updateBuffer(event) {
    const value = Number(event.target.value)
    try {
      setSavingBuffer(true)
      const { data } = await axiosInstance.get('/scheduling/availability')
      const availability = data.availability || {}
      await axiosInstance.put('/scheduling/availability', {
        weekly_schedule: availability.weekly_schedule || [],
        buffer_time: value,
        session_durations: availability.session_durations || [],
        overrides: availability.overrides || [],
        blocked_slots: availability.blocked_slots || [],
        timezone: availability.timezone || 'Asia/Kolkata'
      })
      setBufferTime(value)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save buffer time.')
    } finally {
      setSavingBuffer(false)
    }
  }

  async function refreshSessions() {
    try {
      setRefreshing(true)
      await loadSessions()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to refresh sessions.')
    } finally {
      setRefreshing(false)
    }
  }

  async function startSession(session) {
    try {
      setStartingId(session._id)
      const { data } = await axiosInstance.post(`/scheduling/sessions/${session._id}/start`)
      navigate(`/chat/${data.session._id}?code=${data.session.session_code || ''}`)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to start this session.')
    } finally {
      setStartingId(null)
    }
  }

  useEffect(() => {
    let cancelled = false
    const loadPageData = async () => {
      const [sessionsResponse, availabilityResponse] = await Promise.all([
        axiosInstance.get('/scheduling/sessions', { params: { _: Date.now() } }),
        axiosInstance.get('/scheduling/availability')
      ])
      setSessions(sessionsResponse.data.sessions || [])
      setBufferTime(availabilityResponse.data.availability?.buffer_time || 0)
    }
    const timer = window.setTimeout(() => {
      loadPageData()
        .then(() => {
          if (!cancelled) setError('')
        })
        .catch((requestError) => {
          if (!cancelled) setError(requestError.response?.data?.message || 'Unable to load sessions.')
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 0)
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [])

  return <section className="space-y-8">
    <div className="rounded-[28px] border border-ink/10 bg-sage p-5 sm:p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-sm font-bold uppercase tracking-[.16em] text-moss">Booking rule</p><h2 className="mt-1 font-display text-2xl font-semibold">Set buffer time first</h2><p className="mt-1 text-sm text-ink/60">New slots use this gap between sessions.</p></div><select value={bufferTime} onChange={updateBuffer} disabled={savingBuffer} className="rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-moss"><option value={0}>No buffer</option><option value={5}>5 minutes</option><option value={10}>10 minutes</option><option value={15}>15 minutes</option><option value={30}>30 minutes</option></select></div></div>
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="mb-2 text-sm font-semibold uppercase tracking-[.18em] text-moss">Your calendar</p><h1 className="font-display text-3xl font-semibold">My sessions</h1><p className="mt-2 text-ink/60">Review booked sessions and open the private chat when it is time to start.</p></div>
      <div className="flex flex-wrap gap-2"><button onClick={refreshSessions} disabled={refreshing} className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-3 text-sm font-bold text-ink hover:border-moss hover:text-moss disabled:opacity-50"><RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Refresh</button><button onClick={() => navigate('/schedule')} className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white hover:bg-moss"><CalendarDays size={17} /> Schedule</button></div>
    </header>
    {error && <p className="rounded-xl bg-[#fae2d9] px-4 py-3 text-sm font-medium text-[#9a4932]">{error}</p>}
    {loading && <p className="text-sm text-ink/55">Loading sessions...</p>}
    {!loading && !sessions.length && <p className="rounded-2xl border border-dashed border-ink/15 bg-white p-6 text-sm text-ink/55">No booked sessions yet.</p>}
    <div className="space-y-3">{sessions.map((session) => { const completed = session.status === 'completed'; return <article key={session._id} className="flex flex-col justify-between gap-4 rounded-2xl border border-ink/10 bg-white p-5 sm:flex-row sm:items-center"><div><h2 className="font-display text-xl font-semibold">{session.client_id?.name || 'Client'}</h2><p className="mt-1 text-sm font-bold text-moss">{session.session_code || 'Code pending'}</p><div className="mt-2 flex flex-wrap gap-4 text-sm text-ink/55"><span className="inline-flex items-center gap-2"><CalendarDays size={15} />{new Date(session.starts_at).toLocaleDateString()}</span><span className="inline-flex items-center gap-2"><Clock3 size={15} />{new Date(session.starts_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span><span className="capitalize">{completed ? 'ended' : session.started_at ? 'started' : session.status}</span></div></div><div className="flex flex-wrap gap-2"><button onClick={() => navigate(`/chat/${session._id}?code=${session.session_code || ''}&resume=${Date.now()}`)} disabled={completed} className="inline-flex items-center justify-center gap-2 rounded-full border border-moss px-4 py-2.5 text-sm font-bold text-moss hover:bg-sage disabled:cursor-not-allowed disabled:opacity-40"><MessageCircle size={16} />{completed ? 'Ended' : 'Resume'}</button><button onClick={() => startSession(session)} disabled={completed || startingId === session._id || Boolean(session.started_at)} className="inline-flex items-center justify-center gap-2 rounded-full bg-moss px-5 py-2.5 text-sm font-bold text-white hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"><MessageCircle size={16} />{completed ? 'Ended' : startingId === session._id ? 'Starting...' : session.started_at ? 'Started' : 'Start'}</button></div></article> })}</div>
  </section>
}
