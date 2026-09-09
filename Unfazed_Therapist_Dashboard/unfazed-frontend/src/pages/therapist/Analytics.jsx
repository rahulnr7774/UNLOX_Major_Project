import { Activity, IndianRupee, UsersRound, TrendingUp, Calendar, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
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

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 50)

    axiosInstance
      .get('/analytics')
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
  }, [])

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

  const revenueTrend = data.revenueTrend || []

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
      <section className="grid gap-6 xl:grid-cols-[1.65fr_.75fr]">
        {/* Revenue Chart */}
        <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-500">
                  <TrendingUp size={17} />
                </div>

                <p className="text-sm font-bold uppercase tracking-[.14em] text-[#64748B]">
                  Revenue trend
                </p>
              </div>

              <h2 className="mt-4 font-display text-2xl font-semibold text-[#1E293B]">
                Monthly net revenue
              </h2>

              <p className="mt-1 text-sm text-[#64748B]">
                A simple view of how your practice revenue is moving.
              </p>
            </div>

            {revenueTrend.length > 0 && (
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Revenue tracked
              </div>
            )}
          </div>

          <div className="mt-8 h-72 w-full">
            {revenueTrend.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={revenueTrend}
                  margin={{
                    top: 10,
                    right: 5,
                    left: -15,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient
                      id="revenueFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#8B5CF6"
                        stopOpacity={0.28}
                      />
                      <stop
                        offset="65%"
                        stopColor="#8B5CF6"
                        stopOpacity={0.08}
                      />
                      <stop
                        offset="100%"
                        stopColor="#8B5CF6"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    stroke="#E2E8F0"
                    strokeOpacity={0.7}
                    vertical={false}
                  />

                  <XAxis
                    dataKey="_id"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 11,
                      fill: '#64748B',
                    }}
                    dy={10}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 11,
                      fill: '#64748B',
                    }}
                    tickFormatter={(value) =>
                      value >= 1000
                        ? `₹${Math.round(value / 1000)}k`
                        : `₹${value}`
                    }
                  />

                  <Tooltip
                    cursor={{
                      stroke: '#8B5CF6',
                      strokeWidth: 1,
                      strokeDasharray: '4 4',
                    }}
                    formatter={(value) => [
                      `INR ${Number(value).toLocaleString('en-IN')}`,
                      'Revenue',
                    ]}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '14px',
                      boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
                      padding: '10px 14px',
                    }}
                    labelStyle={{
                      color: '#1E293B',
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#7C3AED"
                    fill="url(#revenueFill)"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: '#7C3AED',
                      stroke: '#FFFFFF',
                      strokeWidth: 3,
                    }}
                    animationDuration={900}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl bg-[#F8FAFC] px-5 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-500">
                  <IndianRupee size={20} />
                </div>

                <p className="mt-4 text-sm font-semibold text-[#1E293B]">
                  No revenue data yet
                </p>

                <p className="mt-1 max-w-sm text-xs leading-5 text-[#64748B]">
                  Revenue information will appear here after successful
                  payments.
                </p>
              </div>
            )}
          </div>
        </section>

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
