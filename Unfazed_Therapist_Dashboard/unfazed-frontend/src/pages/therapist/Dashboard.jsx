import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  CalendarDays,
  ChevronRight,
  Clock3,
  Leaf,
  ListChecks,
  MoreHorizontal,
  Plus,
  UsersRound,
} from 'lucide-react'
import RevenueChart from '../../components/analytics/RevenueChart'
import ClientCard from '../../components/crm/ClientCard'
import axiosInstance from '../../api/axiosInstance'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

function startOfWeek(value) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  const day = date.getDay()
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1))
  return date
}

function Dashboard() {
  const [sessions, setSessions] = useState([])
  const [clients, setClients] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [state, setState] = useState({ loading: true, error: '' })
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/scheduling/sessions'),
      axiosInstance.get('/clients'),
      axiosInstance.get('/analytics'),
    ])
      .then(([sessionResponse, clientResponse, analyticsResponse]) => {
        setSessions(sessionResponse.data.sessions || [])
        setClients(clientResponse.data.clients || [])
        setAnalytics(analyticsResponse.data)
      })
      .catch((error) =>
        setState({
          loading: false,
          error: error.response?.data?.message || 'Unable to load dashboard data.',
        })
      )
      .finally(() => setState((current) => ({ ...current, loading: false })))
  }, [])

  const weekStart = startOfWeek(new Date())
  const weekSessions = useMemo(
    () =>
      sessions.filter(
        (session) =>
          new Date(session.starts_at) >= weekStart &&
          new Date(session.starts_at) < new Date(weekStart.getTime() + 7 * 86400000) &&
          session.status !== 'cancelled'
      ),
    [sessions, weekStart]
  )
  const practiceHours = weekSessions.reduce(
    (total, session) =>
      total + (new Date(session.ends_at) - new Date(session.starts_at)) / 3600000,
    0
  )
  const upcomingSessions = sessions
    .filter(
      (session) =>
        new Date(session.starts_at) >= new Date() &&
        !['cancelled', 'completed'].includes(session.status)
    )
    .slice(0, 4)
  const greetingName = user?.name || 'Therapist'
  const today = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  return (
    <>
          {/* Header */}
          <header className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[.18em] text-violet-600">
                {today}
              </p>
              <h1 className="font-display text-4xl font-semibold tracking-[-.04em] text-[#1E293B] sm:text-5xl">
                Good morning, {greetingName}.
              </h1>
              <p className="mt-3 max-w-lg text-base text-[#64748B]">
                A live view of your practice and what needs your attention today.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/schedule')}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-violet-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-violet-600"
              >
                <Plus size={17} /> New session
              </button>
              <button
                onClick={() => navigate('/sessions')}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-[#1E293B] transition-colors hover:border-violet-500 hover:text-violet-600"
              >
                <ListChecks size={17} /> My sessions
              </button>
            </div>
          </header>

          {state.error && (
            <p className="mb-6 rounded-xl bg-red-100 px-4 py-3 text-sm text-red-700">
              {state.error}
            </p>
          )}

          {state.loading ? (
            <p className="text-sm text-[#64748B]">Loading your practice data...</p>
          ) : (
            <>
              {/* Stats - now using custom violet-themed cards for full control */}
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[#64748B]">Sessions this week</p>
                    <CalendarDays size={20} className="text-violet-500" />
                  </div>
                  <p className="mt-4 text-3xl font-semibold text-[#1E293B]">{weekSessions.length}</p>
                  <p className="mt-1 text-xs font-medium text-violet-600">▲ Live</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[#64748B]">Active clients</p>
                    <UsersRound size={20} className="text-violet-500" />
                  </div>
                  <p className="mt-4 text-3xl font-semibold text-[#1E293B]">
                    {analytics?.activeClients ?? clients.filter((client) => client.status === 'active').length}
                  </p>
                  <p className="mt-1 text-xs font-medium text-violet-600">▲ Current</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[#64748B]">Hours in practice</p>
                    <Clock3 size={20} className="text-violet-500" />
                  </div>
                  <p className="mt-4 text-3xl font-semibold text-[#1E293B]">{practiceHours.toFixed(1)}</p>
                  <p className="mt-1 text-xs font-medium text-violet-600">▲ This week</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[#64748B]">Net revenue</p>
                    <Activity size={20} className="text-violet-500" />
                  </div>
                  <p className="mt-4 text-3xl font-semibold text-[#1E293B]">
                    INR {Number(analytics?.revenue?.net || 0).toLocaleString('en-IN')}
                  </p>
                  <p className="mt-1 text-xs font-medium text-violet-600">▲ All time</p>
                </div>
              </section>

              {/* Revenue & Rhythm */}
              <section className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
                <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(31,41,36,.05)] sm:p-8">
                  <div className="mb-7 flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[.15em] text-[#64748B]">
                        Practice pulse
                      </p>
                      <h2 className="mt-2 font-display text-2xl font-semibold text-[#1E293B]">
                        Revenue overview
                      </h2>
                    </div>
                    <button
                      onClick={() => navigate('/analytics')}
                      className="rounded-full p-2 text-[#64748B] hover:bg-slate-100"
                      aria-label="Open analytics"
                    >
                      <MoreHorizontal size={21} />
                    </button>
                  </div>
                  <RevenueChart data={analytics?.revenueTrend || []} />
                </div>

                <div className="rounded-[28px] border border-violet-200 bg-violet-50/60 p-6 sm:p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-violet-500 shadow-sm">
                      <Leaf size={19} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-[.16em] text-violet-600">
                      Your rhythm
                    </span>
                  </div>
                  <h2 className="mt-12 max-w-xs font-display text-3xl font-semibold leading-tight text-[#1E293B]">
                    Keep your practice visible and steady.
                  </h2>
                  <p className="mt-4 max-w-xs text-sm leading-6 text-[#64748B]">
                    You have {upcomingSessions.length} upcoming session
                    {upcomingSessions.length === 1 ? '' : 's'} on your calendar.
                  </p>
                  <button
                    onClick={() => navigate('/schedule')}
                    className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-violet-600"
                  >
                    View schedule <ChevronRight size={16} />
                  </button>
                </div>
              </section>

              {/* Upcoming Sessions & Recently Active */}
              <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
                <div className="rounded-[28px] border border-slate-200 bg-white p-6 sm:p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[.15em] text-[#64748B]">
                        Upcoming
                      </p>
                      <h2 className="mt-2 font-display text-2xl font-semibold text-[#1E293B]">
                        Next sessions
                      </h2>
                    </div>
                    <button
                      onClick={() => navigate('/sessions')}
                      className="text-sm font-bold text-violet-600"
                    >
                      See all
                    </button>
                  </div>
                  <div className="space-y-3">
                    {upcomingSessions.map((session) => (
                      <div
                        key={session._id}
                        className="flex items-center gap-4 rounded-2xl border border-slate-100 p-4 transition-shadow hover:shadow-md"
                      >
                        <div className="w-20 text-sm font-bold text-[#64748B]">
                          {new Date(session.starts_at).toLocaleTimeString([], {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="h-10 w-1 rounded-full bg-amber-400" />
                        <div className="flex-1">
                          <p className="font-semibold text-[#1E293B]">
                            {session.client_id?.name || 'Client session'}
                          </p>
                          <p className="mt-1 text-xs text-[#64748B]">
                            {new Date(session.starts_at).toLocaleDateString()} ·{' '}
                            {Math.round(
                              (new Date(session.ends_at) - new Date(session.starts_at)) / 60000
                            )}{' '}
                            min
                          </p>
                        </div>
                        <span className="text-xs font-bold capitalize text-violet-600">
                          {session.status}
                        </span>
                      </div>
                    ))}
                    {!upcomingSessions.length && (
                      <p className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-[#64748B]">
                        No upcoming sessions.
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-[#F1F5F9] p-6 sm:p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[.15em] text-[#64748B]">
                        People
                      </p>
                      <h2 className="mt-2 font-display text-2xl font-semibold text-[#1E293B]">
                        Recently active
                      </h2>
                    </div>
                    <button
                      onClick={() => navigate('/clients')}
                      className="text-sm font-bold text-violet-600"
                    >
                      All clients
                    </button>
                  </div>
                  <div className="space-y-2">
                    {clients.slice(0, 5).map((client) => (
                      <ClientCard key={client._id} client={client} />
                    ))}
                    {!clients.length && (
                      <p className="text-sm text-[#64748B]">No clients yet.</p>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}
    </>
  )
}

export default Dashboard