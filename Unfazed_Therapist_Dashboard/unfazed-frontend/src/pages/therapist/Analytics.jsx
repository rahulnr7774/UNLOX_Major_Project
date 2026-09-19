import { Activity, IndianRupee, UsersRound, TrendingUp, Calendar, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import axiosInstance from '../../api/axiosInstance'
import UpgradePrompt from '../../components/common/UpgradePrompt'
import PageBackButton from '../../components/common/PageBackButton'

const statCards = [
  {
    key: 'revenue',
    label: 'Net revenue',
    icon: IndianRupee,
    accent: 'violet',
  },
  {
    key: 'clients',
    label: 'Active clients',
    icon: UsersRound,
    accent: 'violet',
  },
  {
    key: 'noShow',
    label: 'No-show rate',
    icon: Activity,
    accent: 'violet',
  },
]

export default function Analytics() {
  const [data, setData] = useState(null)
  const [state, setState] = useState({
    loading: true,
    blocked: false,
    error: '',
  })
  const [mounted, setMounted] = useState(false)
  const [period, setPeriod] = useState('month')

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 50)

    axiosInstance
      .get('/analytics', { params: { period } })
      .then(({ data: response }) => setData(response))
      .catch((error) =>
        setState({
          loading: false,
          blocked:
            error.response?.status === 403 &&
            error.response?.data?.upgradeRequired,
          error:
            error.response?.data?.message ||
            'Unable to load analytics.',
        })
      )
      .finally(() =>
        setState((current) => ({
          ...current,
          loading: false,
        }))
      )

    return () => window.clearTimeout(timer)
  }, [period])

  if (state.loading) {
    return (
      <section className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12">
        <div className="animate-pulse space-y-6">
          <div className="h-4 w-32 rounded-full bg-slate-200" />
          <div className="h-10 w-52 rounded-xl bg-slate-200" />
          <div className="h-5 w-80 rounded-full bg-slate-100" />

          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-36 rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>

          <div className="h-[390px] rounded-[28px] border border-slate-200 bg-white" />
        </div>
      </section>
    )
  }

  if (state.blocked) {
    return (
      <section className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12">
        <UpgradePrompt feature="Practice analytics" />
      </section>
    )
  }

  if (state.error || !data) {
    return (
      <section className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {state.error || 'Analytics unavailable.'}
        </div>
      </section>
    )
  }

  const timeline = data.timeline || []
  const periodLabels = { week: 'Weekly', month: 'Monthly', year: 'Yearly' }

  return (
    <section
      className={`mx-auto max-w-[1440px] space-y-8 px-5 py-8 transition-all duration-500 sm:px-8 lg:px-12 lg:py-10 ${
        mounted
          ? 'translate-y-0 opacity-100'
          : 'translate-y-2 opacity-0'
      }`}
    >
      <PageBackButton to="/dashboard" label="Back to dashboard" />

      {/* Header */}
      <header className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
        {/* Decorative background */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-violet-50 blur-3xl" />

        <div className="relative">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[.14em] text-violet-600">
                <TrendingUp size={13} />
                Practice insights
              </div>

              <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-.04em] text-[#1E293B] sm:text-5xl">
                Analytics
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#64748B] sm:text-base">
                Understand your practice at a glance with revenue,
                client activity, and attendance insights.
              </p>
            </div>

            <div className="hidden h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-500 sm:flex">
              <Activity size={25} />
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Net revenue"
          value={`INR ${Number(data.revenue?.net || 0).toLocaleString('en-IN')}`}
          helper={`${data.revenue?.count || 0} successful payments`}
          icon={IndianRupee}
          delay="delay-75"
        />

        <StatCard
          label="Active clients"
          value={data.activeClients ?? 0}
          helper="Currently active"
          icon={UsersRound}
          delay="delay-150"
        />

        <StatCard
          label="No-show rate"
          value={`${Number(data.noShowRate || 0).toFixed(1)}%`}
          helper="Across all sessions"
          icon={Activity}
          delay="delay-200"
        />
      </section>

      {/* Main analytics */}
      <section className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.14em] text-[#64748B]">Practice performance</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-[#1E293B]">{periodLabels[period]} activity</h2>
          </div>
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            {Object.entries(periodLabels).map(([key, label]) => (
              <button key={key} type="button" onClick={() => setPeriod(key)} className={`rounded-lg px-4 py-2 text-sm font-bold transition ${period === key ? 'bg-white text-violet-600 shadow-sm' : 'text-[#64748B] hover:text-[#1E293B]'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <ChartPanel title="Session health" subtitle="Booked, completed, and client activity across the selected period." icon={Calendar}>
            {timeline.length ? <ResponsiveContainer width="100%" height="100%"><ComposedChart data={timeline} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="#E2E8F0" strokeOpacity={0.7} vertical={false} />
              <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dy={10} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
              <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Bar dataKey="bookedSessions" name="Booked" fill="#A78BFA" radius={[5, 5, 0, 0]} />
              <Line type="monotone" dataKey="successfulSessions" name="Successful" stroke="#10B981" strokeWidth={3} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="clientsVisited" name="Clients visited" stroke="#2563EB" strokeWidth={3} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="noShows" name="No-shows" stroke="#F59E0B" strokeWidth={2} dot={{ r: 2 }} />
              <Line type="monotone" dataKey="cancelledSessions" name="Cancelled" stroke="#EF4444" strokeWidth={2} dot={{ r: 2 }} />
            </ComposedChart></ResponsiveContainer> : <EmptyChart message="No session activity for this period." />}
          </ChartPanel>

          <ChartPanel title="Revenue & payments" subtitle="Net revenue and successful payment volume." icon={IndianRupee}>
            {timeline.length ? <ResponsiveContainer width="100%" height="100%"><ComposedChart data={timeline} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid stroke="#E2E8F0" strokeOpacity={0.7} vertical={false} />
              <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dy={10} />
              <YAxis yAxisId="revenue" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(value) => value >= 1000 ? `₹${Math.round(value / 1000)}k` : `₹${value}`} />
              <YAxis yAxisId="payments" orientation="right" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
              <Tooltip formatter={(value, name) => [name === 'Revenue' ? `INR ${Number(value).toLocaleString('en-IN')}` : value, name]} contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Bar yAxisId="revenue" dataKey="revenue" name="Revenue" fill="#7C3AED" radius={[5, 5, 0, 0]} />
              <Line yAxisId="payments" type="monotone" dataKey="payments" name="Payments" stroke="#10B981" strokeWidth={3} dot={{ r: 3 }} />
            </ComposedChart></ResponsiveContainer> : <EmptyChart message="No payment activity for this period." />}
          </ChartPanel>
        </div>

        {/* Practice Snapshot */}
        <section className="relative overflow-hidden rounded-[30px] border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-violet-200/40 blur-3xl" />

          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-violet-500 shadow-sm">
                <Activity size={20} />
              </div>

              <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold uppercase tracking-[.13em] text-violet-600">
                Snapshot
              </span>
            </div>

            <h2 className="mt-10 font-display text-3xl font-semibold leading-tight text-[#1E293B]">
              Your practice,
              <br />
              at a glance.
            </h2>

            <p className="mt-4 text-sm leading-6 text-[#64748B]">
              Keep an eye on the numbers that matter most while you focus
              on your clients.
            </p>

            <div className="mt-8 space-y-3">
              <div className="flex items-center justify-between rounded-2xl bg-white/80 p-4">
                <div className="flex items-center gap-3">
                  <UsersRound size={17} className="text-violet-500" />
                  <span className="text-sm font-medium text-[#64748B]">
                    Active clients
                  </span>
                </div>

                <span className="font-display text-lg font-semibold text-[#1E293B]">
                  {data.activeClients ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-white/80 p-4">
                <div className="flex items-center gap-3">
                  <IndianRupee size={17} className="text-violet-500" />
                  <span className="text-sm font-medium text-[#64748B]">
                    Payments
                  </span>
                </div>

                <span className="font-display text-lg font-semibold text-[#1E293B]">
                  {data.revenue?.count || 0}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-white/80 p-4">
                <div className="flex items-center gap-3">
                  <Activity size={17} className="text-violet-500" />
                  <span className="text-sm font-medium text-[#64748B]">
                    No-shows
                  </span>
                </div>

                <span className="font-display text-lg font-semibold text-[#1E293B]">
                  {Number(data.noShowRate || 0).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </section>
      </section>

      {/* Insight Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <InsightCard
          icon={Calendar}
          title="Client activity"
          text="Track active clients and understand how your practice is growing over time."
        />

        <InsightCard
          icon={Clock}
          title="Attendance"
          text="Your no-show rate gives you a quick view of appointment reliability."
        />

        <InsightCard
          icon={TrendingUp}
          title="Revenue"
          text="Use your monthly revenue trend to understand the financial rhythm of your practice."
        />
      </section>

      {/* Upgrade */}
      {!data.advancedAnalytics && (
        <div className="overflow-hidden rounded-[30px] border border-violet-200 bg-violet-50/40 p-1">
          <UpgradePrompt feature="Detailed analytics" />
        </div>
      )}
    </section>
  )
}

function ChartPanel({ title, subtitle, icon: Icon, children }) {
  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-500">
          <Icon size={18} />
        </div>
        <div>
          <h3 className="font-display text-2xl font-semibold text-[#1E293B]">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-[#64748B]">{subtitle}</p>
        </div>
      </div>
      <div className="mt-8 h-80 w-full">{children}</div>
    </section>
  )
}

function EmptyChart({ message }) {
  return <div className="flex h-full items-center justify-center rounded-2xl bg-[#F8FAFC] px-5 text-center text-sm text-[#64748B]">{message}</div>
}

function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  delay = '',
}) {
  return (
    <div
      className={`group rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md ${delay}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[#64748B]">
          {label}
        </p>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-500 transition-colors duration-200 group-hover:bg-violet-100">
          <Icon size={19} />
        </div>
      </div>

      <p className="mt-5 truncate font-display text-3xl font-semibold tracking-[-.03em] text-[#1E293B]">
        {value}
      </p>

      <p className="mt-1 text-xs font-medium text-violet-600">
        {helper}
      </p>
    </div>
  )
}

function InsightCard({ icon: Icon, title, text }) {
  return (
    <div className="group rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-500 transition-colors duration-200 group-hover:bg-violet-100">
        <Icon size={18} />
      </div>

      <h3 className="mt-5 font-display text-lg font-semibold text-[#1E293B]">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-[#64748B]">
        {text}
      </p>
    </div>
  )
}
