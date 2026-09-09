import { useEffect, useState } from 'react'
import { ArrowLeft, CalendarDays, Clock3, MessageCircle, RefreshCw, Square, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../api/axiosInstance'

export default function Sessions() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [startingId, setStartingId] = useState(null)
  const [endingId, setEndingId] = useState(null)
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
      await axiosInstance.post(`/scheduling/sessions/${session._id}/start`)
      await loadSessions()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to start this session.')
    } finally {
      setStartingId(null)
    }
  }

  async function endSession(session) {
    try {
      setEndingId(session._id)
      await axiosInstance.post(`/scheduling/sessions/${session._id}/end`)
      await loadSessions()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to end this session.')
    } finally {
      setEndingId(null)
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

  return (
    <section className="relative mx-auto max-w-[1440px] overflow-hidden px-5 py-8 sm:px-8 lg:px-12">
      {/* Decorative background */}
      <div className="pointer-events-none absolute -right-40 top-16 h-96 w-96 rounded-full bg-violet-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -left-40 top-[600px] h-96 w-96 rounded-full bg-purple-200/20 blur-3xl" />

      <div className="relative space-y-10">
        {/* Buffer time setting – styled like a card */}
        <div className="group animate-[fadeSlideDown_.6s_ease-out] overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100/40 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[.16em] text-violet-500">
                <Sparkles size={14} className="inline mr-1.5" />
                Booking rule
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-[#1E293B]">
                Set buffer time first
              </h2>
              <p className="mt-1 text-sm text-[#64748B]">
                New slots use this gap between sessions.
              </p>
            </div>
            <select
              value={bufferTime}
              onChange={updateBuffer}
              disabled={savingBuffer}
              className="h-12 w-full max-w-[200px] rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 text-sm font-bold text-[#1E293B] outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:opacity-50 sm:w-auto"
            >
              <option value={0}>No buffer</option>
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
            </select>
          </div>
        </div>

        {/* Back button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#64748B] transition-all hover:text-[#1E293B]"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </button>

        {/* Header */}
        <header className="animate-[fadeSlideDown_.6s_.1s_ease-out] flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[.16em] text-violet-600">
              <CalendarDays size={13} />
              Your calendar
            </div>
            <h1 className="font-display text-4xl font-semibold tracking-[-.04em] text-[#1E293B] sm:text-5xl">
              My sessions
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#64748B] sm:text-base">
              Review booked sessions and open the private chat when it is time to start.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={refreshSessions}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#64748B] shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50/50 hover:text-violet-600 disabled:opacity-50"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={() => navigate('/schedule')}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-300"
            >
              <CalendarDays size={17} />
              Schedule
            </button>
          </div>
        </header>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700 shadow-sm">
            <span>{error}</span>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12 text-sm text-[#64748B]">
            <RefreshCw size={20} className="mr-2 animate-spin" />
            Loading sessions...
          </div>
        )}

        {/* Empty state */}
        {!loading && !sessions.length && (
          <div className="group relative overflow-hidden rounded-[28px] border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm transition-all duration-300 hover:border-violet-300 hover:bg-violet-50/20 sm:p-16">
            <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-violet-100/40 blur-3xl" />
            <div className="relative">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-violet-400 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-violet-100">
                <CalendarDays size={28} />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold text-[#1E293B]">
                No booked sessions yet
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#64748B]">
                Sessions will appear here once clients book appointments.
              </p>
            </div>
          </div>
        )}

        {/* Session cards */}
        <div className="space-y-5">
          {sessions.map((session, index) => {
            const completed = session.status === 'completed'
            const cancelled = session.status === 'cancelled'
            const active = Boolean(session.started_at) && !completed && !cancelled

            return (
              <article
                key={session._id}
                style={{ animationDelay: `${index * 100 + 200}ms` }}
                className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white opacity-0 shadow-sm animate-[fadeSlideUp_.55s_ease-out_forwards] transition-all duration-500 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100/40"
              >
                {/* Top accent */}
                <div className="h-1 w-full bg-gradient-to-r from-violet-400 via-purple-500 to-violet-600 opacity-70 transition-opacity duration-300 group-hover:opacity-100" />

                {/* Decorative glow */}
                <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-100/50 blur-3xl transition-all duration-700 group-hover:scale-150 group-hover:bg-violet-200/50" />

                <div className="relative flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center sm:p-7">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-[#1E293B] sm:text-2xl">
                      {session.client_id?.name || 'Client'}
                    </h2>
                    <p className="mt-1 text-sm font-bold text-violet-600">
                      {session.session_code || 'Code pending'}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-[#64748B]">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays size={15} className="text-violet-500" />
                        {new Date(session.starts_at).toLocaleDateString()}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Clock3 size={15} className="text-violet-500" />
                        {new Date(session.starts_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                          completed
                            ? 'bg-slate-100 text-slate-600'
                            : cancelled
                            ? 'bg-rose-100 text-rose-600'
                            : active
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            active ? 'animate-pulse bg-emerald-500' : 'bg-current'
                          }`}
                        />
                        {completed ? 'Ended' : cancelled ? 'Cancelled' : active ? 'Active' : 'Scheduled'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => navigate(`/chat/${session._id}?code=${session.session_code || ''}&resume=${Date.now()}`)}
                      disabled={!active}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-violet-200 bg-white px-4 py-2.5 text-sm font-bold text-violet-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <MessageCircle size={16} />
                      {completed || cancelled ? 'Unavailable' : 'Open chat'}
                    </button>

                    {active ? (
                      <button
                        onClick={() => endSession(session)}
                        disabled={endingId === session._id}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-200 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Square size={15} />
                        {endingId === session._id ? 'Ending...' : 'End session'}
                      </button>
                    ) : (
                      <button
                        onClick={() => startSession(session)}
                        disabled={completed || cancelled || startingId === session._id}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <MessageCircle size={16} />
                        {completed ? 'Ended' : cancelled ? 'Cancelled' : startingId === session._id ? 'Starting...' : 'Start session'}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeSlideDown {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  )
}