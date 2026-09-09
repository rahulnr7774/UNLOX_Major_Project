import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowRight,
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

  date.setDate(
    date.getDate() - (day === 0 ? 6 : day - 1)
  )

  return date
}

function Dashboard() {
  const [sessions, setSessions] = useState([])
  const [clients, setClients] = useState([])
  const [analytics, setAnalytics] = useState(null)

  const [state, setState] = useState({
    loading: true,
    error: '',
  })

  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/scheduling/sessions'),
      axiosInstance.get('/clients'),
      axiosInstance.get('/analytics'),
    ])
      .then(
        ([
          sessionResponse,
          clientResponse,
          analyticsResponse,
        ]) => {
          setSessions(
            sessionResponse.data.sessions || []
          )

          setClients(
            clientResponse.data.clients || []
          )

          setAnalytics(analyticsResponse.data)
        }
      )
      .catch((error) =>
        setState({
          loading: false,
          error:
            error.response?.data?.message ||
            'Unable to load dashboard data.',
        })
      )
      .finally(() =>
        setState((current) => ({
          ...current,
          loading: false,
        }))
      )
  }, [])

  const weekStart = startOfWeek(new Date())

  const weekSessions = useMemo(
    () =>
      sessions.filter((session) => {
        const startsAt = new Date(session.starts_at)

        return (
          startsAt >= weekStart &&
          startsAt <
            new Date(
              weekStart.getTime() + 7 * 86400000
            ) &&
          session.status !== 'cancelled'
        )
      }),
    [sessions, weekStart]
  )

  const practiceHours = weekSessions.reduce(
    (total, session) =>
      total +
      (new Date(session.ends_at) -
        new Date(session.starts_at)) /
        3600000,
    0
  )

  const upcomingSessions = sessions
    .filter(
      (session) =>
        new Date(session.starts_at) >= new Date() &&
        !['cancelled', 'completed'].includes(
          session.status
        )
    )
    .sort(
      (a, b) =>
        new Date(a.starts_at) -
        new Date(b.starts_at)
    )
    .slice(0, 4)

  const greetingName = user?.name || 'Therapist'
  const currentHour = new Date().getHours()
  const greeting =
    currentHour < 12
      ? 'Good morning'
      : currentHour < 18
        ? 'Good afternoon'
        : 'Good evening'

  const today = new Intl.DateTimeFormat(
    undefined,
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  ).format(new Date())

  return (
    <main className="min-h-screen bg-[#FAFAF9] text-[#1E293B]">
      <div className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 lg:px-12 lg:py-10">

        {/* =====================================================
            HEADER
        ====================================================== */}
        <header className="mb-9 animate-[fadeSlideDown_.6s_ease-out]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600">
                <Leaf size={12} />
                {today}
              </div>

              <h1 className="font-display text-3xl font-semibold tracking-[-0.035em] text-[#1E293B] sm:text-4xl lg:text-5xl">
                {greeting}, {greetingName}.
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-[#64748B] sm:text-base">
                A clear view of your practice, upcoming
                sessions, and the people who need your
                attention.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/schedule')}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-violet-500 px-5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-violet-600 hover:shadow-md"
              >
                <Plus size={17} />
                New session
              </button>

              <button
                onClick={() => navigate('/sessions')}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-5 text-sm font-bold text-[#1E293B] transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:text-violet-600 hover:shadow-md"
              >
                <ListChecks size={17} />
                My sessions
              </button>
            </div>
          </div>
        </header>

        {/* =====================================================
            ERROR
        ====================================================== */}
        {state.error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 animate-[fadeSlideDown_.4s_ease-out]">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />
            <p>{state.error}</p>
          </div>
        )}

        {state.loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* =================================================
                STATS
            ================================================== */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Sessions this week"
                value={weekSessions.length}
                helper="Scheduled this week"
                icon={CalendarDays}
                delay={0}
              />
              <StatCard
                label="Active clients"
                value={
                  analytics?.activeClients ??
                  clients.filter(
                    (client) =>
                      client.status === 'active'
                  ).length
                }
                helper="Currently active"
                icon={UsersRound}
                delay={100}
              />
              <StatCard
                label="Hours in practice"
                value={practiceHours.toFixed(1)}
                helper="Hours this week"
                icon={Clock3}
                delay={200}
              />
              <StatCard
                label="Net revenue"
                value={`INR ${Number(
                  analytics?.revenue?.net || 0
                ).toLocaleString('en-IN')}`}
                helper="All time"
                icon={Activity}
                delay={300}
              />
            </section>

            {/* =================================================
                REVENUE + PRACTICE PULSE
            ================================================== */}
            <section className="mt-7 grid gap-6 xl:grid-cols-[1.55fr_.75fr]">

              {/* Revenue */}
              <div className="rounded-[26px] border border-[#E2E8F0] bg-white p-6 shadow-[0_8px_35px_rgba(15,23,42,0.035)] transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100/40 sm:p-8 animate-[fadeSlideUp_.6s_.1s_ease-out]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#94A3B8]">
                      Practice pulse
                    </p>

                    <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-[#1E293B]">
                      Revenue overview
                    </h2>

                    <p className="mt-1 text-sm text-[#64748B]">
                      Keep track of your practice performance.
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      navigate('/analytics')
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[#94A3B8] transition-colors duration-150 hover:bg-slate-50 hover:text-violet-600"
                    aria-label="Open analytics"
                  >
                    <MoreHorizontal size={20} />
                  </button>
                </div>

                <div className="mt-7">
                  <RevenueChart
                    data={
                      analytics?.revenueTrend || []
                    }
                  />
                </div>
              </div>

              {/* Practice pulse */}
              <div className="relative overflow-hidden rounded-[26px] border border-violet-100 bg-[#F5F3FF] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-100/40 sm:p-8 animate-[fadeSlideUp_.6s_.2s_ease-out]">

                <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-violet-200/30" />

                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
                      <Leaf size={19} />
                    </div>

                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600">
                      Your rhythm
                    </span>
                  </div>

                  <h2 className="mt-12 max-w-xs font-display text-2xl font-semibold leading-tight tracking-tight text-[#1E293B] sm:text-3xl">
                    Keep your practice visible and steady.
                  </h2>

                  <p className="mt-4 max-w-xs text-sm leading-6 text-[#64748B]">
                    You have{' '}
                    <span className="font-bold text-[#1E293B]">
                      {upcomingSessions.length}
                    </span>{' '}
                    upcoming session
                    {upcomingSessions.length === 1
                      ? ''
                      : 's'}{' '}
                    on your calendar.
                  </p>

                  <button
                    onClick={() =>
                      navigate('/schedule')
                    }
                    className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-violet-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-violet-600 hover:text-white hover:shadow-md"
                  >
                    View schedule
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </section>

            {/* =================================================
                UPCOMING + CLIENTS
            ================================================== */}
            <section className="mt-7 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">

              {/* Upcoming */}
              <div className="rounded-[26px] border border-[#E2E8F0] bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.025)] transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100/40 sm:p-8 animate-[fadeSlideUp_.6s_.3s_ease-out]">
                <div className="mb-6 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#94A3B8]">
                      Upcoming
                    </p>

                    <h2 className="mt-2 font-display text-2xl font-semibold text-[#1E293B]">
                      Next sessions
                    </h2>
                  </div>

                  <button
                    onClick={() =>
                      navigate('/sessions')
                    }
                    className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 transition-colors hover:text-violet-700"
                  >
                    See all
                    <ArrowRight size={14} />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {upcomingSessions.map(
                    (session, index) => {
                      const duration = Math.round(
                        (new Date(
                          session.ends_at
                        ) -
                          new Date(
                            session.starts_at
                          )) /
                          60000
                      )

                      return (
                        <div
                          key={session._id}
                          style={{ animationDelay: `${index * 80 + 400}ms` }}
                          className="group flex flex-col gap-4 rounded-2xl border border-[#E8EDF2] bg-[#FAFAF9] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:bg-white hover:shadow-sm opacity-0 animate-[fadeSlideUp_.5s_ease-out_forwards] sm:flex-row sm:items-center"
                        >
                          {/* Time */}
                          <div className="w-20 shrink-0">
                            <p className="text-sm font-bold text-[#1E293B]">
                              {new Date(
                                session.starts_at
                              ).toLocaleTimeString(
                                [],
                                {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                }
                              )}
                            </p>

                            <p className="mt-1 text-[10px] font-medium text-[#94A3B8]">
                              {new Date(
                                session.starts_at
                              ).toLocaleDateString(
                                [],
                                {
                                  day: 'numeric',
                                  month: 'short',
                                }
                              )}
                            </p>
                          </div>

                          {/* Accent */}
                          <div className="hidden h-10 w-1 rounded-full bg-violet-400 sm:block" />

                          {/* Details */}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-[#1E293B]">
                              {session.client_id
                                ?.name ||
                                'Client session'}
                            </p>

                            <div className="mt-1 flex items-center gap-2 text-xs text-[#94A3B8]">
                              <Clock3 size={12} />
                              {duration} min
                            </div>
                          </div>

                          {/* Status */}
                          <span className="inline-flex w-fit rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold capitalize text-violet-600">
                            {session.status}
                          </span>
                        </div>
                      )
                    }
                  )}

                  {!upcomingSessions.length && (
                    <div className="rounded-2xl border border-dashed border-[#DDE3E8] bg-[#FAFAF9] px-5 py-9 text-center">
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#94A3B8] shadow-sm">
                        <CalendarDays size={19} />
                      </div>

                      <p className="mt-3 text-sm font-bold text-[#1E293B]">
                        No upcoming sessions
                      </p>

                      <p className="mt-1 text-xs text-[#64748B]">
                        Your upcoming appointments will
                        appear here.
                      </p>

                      <button
                        onClick={() =>
                          navigate('/schedule')
                        }
                        className="mt-4 inline-flex items-center gap-2 rounded-full bg-violet-500 px-4 py-2.5 text-xs font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-violet-600 hover:shadow-md"
                      >
                        Schedule session
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Clients */}
              <div className="rounded-[26px] border border-[#E2E8F0] bg-[#F1F5F9] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100/40 sm:p-8 animate-[fadeSlideUp_.6s_.4s_ease-out]">
                <div className="mb-6 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#94A3B8]">
                      People
                    </p>

                    <h2 className="mt-2 font-display text-2xl font-semibold text-[#1E293B]">
                      Recently active
                    </h2>
                  </div>

                  <button
                    onClick={() =>
                      navigate('/clients')
                    }
                    className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 transition-colors hover:text-violet-700"
                  >
                    All clients
                    <ArrowRight size={14} />
                  </button>
                </div>

                <div className="space-y-2">
                  {clients
                    .slice(0, 5)
                    .map((client, index) => (
                      <div
                        key={client._id}
                        style={{ animationDelay: `${index * 80 + 450}ms` }}
                        className="opacity-0 animate-[fadeSlideUp_.5s_ease-out_forwards]"
                      >
                        <ClientCard
                          client={client}
                        />
                      </div>
                    ))}

                  {!clients.length && (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-5 py-9 text-center">
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#94A3B8] shadow-sm">
                        <UsersRound size={19} />
                      </div>

                      <p className="mt-3 text-sm font-bold text-[#1E293B]">
                        No clients yet
                      </p>

                      <p className="mt-1 text-xs text-[#64748B]">
                        Your active clients will appear
                        here.
                      </p>

                      <button
                        onClick={() =>
                          navigate('/clients')
                        }
                        className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-bold text-violet-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-violet-500 hover:text-white hover:shadow-md"
                      >
                        View clients
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
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
    </main>
  )
}

/* ================================================================
   STAT CARD
================================================================ */

function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  delay = 0,
}) {
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className="group rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_5px_20px_rgba(15,23,42,0.025)] transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100/40 opacity-0 animate-[fadeSlideUp_.6s_ease-out_forwards] sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">
            {label}
          </p>

          <p className="mt-3 font-display text-2xl font-semibold tracking-tight text-[#1E293B] sm:text-3xl">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
          <Icon size={18} />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />

        <p className="text-xs font-medium text-[#64748B]">
          {helper}
        </p>
      </div>
    </div>
  )
}

/* ================================================================
   LOADING STATE
================================================================ */

function DashboardSkeleton() {
  return (
    <div className="space-y-7">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-2xl border border-[#E2E8F0] bg-white"
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_.75fr]">
        <div className="h-[390px] animate-pulse rounded-[26px] bg-white" />
        <div className="h-[390px] animate-pulse rounded-[26px] bg-violet-50" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <div className="h-[400px] animate-pulse rounded-[26px] bg-white" />
        <div className="h-[400px] animate-pulse rounded-[26px] bg-slate-100" />
      </div>
    </div>
  )
}

export default Dashboard