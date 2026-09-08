import { Activity, IndianRupee, UsersRound, TrendingUp, Calendar, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import axiosInstance from '../../api/axiosInstance'
import StatCard from '../../components/analytics/StatCard'
import UpgradePrompt from '../../components/common/UpgradePrompt'

export default function Analytics() {
  const [data, setData] = useState(null)
  const [state, setState] = useState({ loading: true, blocked: false, error: '' })

  useEffect(() => {
    axiosInstance.get('/analytics')
      .then(({ data: response }) => setData(response))
      .catch((error) => setState({
        loading: false,
        blocked: error.response?.status === 403 && error.response?.data?.upgradeRequired,
        error: error.response?.data?.message || 'Unable to load analytics.'
      }))
      .finally(() => setState((current) => ({ ...current, loading: false })))
  }, [])

  if (state.loading) {
    return (
      <section className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12">
        <p className="text-sm text-[#64748B]">Loading analytics...</p>
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
        <p className="text-sm text-red-600">{state.error || 'Analytics unavailable.'}</p>
      </section>
    )
  }

  const revenueTrend = data.revenueTrend || []

  return (
    <section className="mx-auto max-w-[1440px] space-y-10 px-5 py-8 sm:px-8 lg:px-12">
      {/* Header */}
      <header>
        <p className="text-sm font-bold uppercase tracking-[.16em] text-violet-600">Practice insights</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-[#1E293B]">Analytics</h1>
        <p className="mt-2 text-[#64748B]">
          Revenue, active clients, and attendance calculated from your practice data.
        </p>
      </header>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[#64748B]">Net revenue</p>
            <IndianRupee size={20} className="text-violet-500" />
          </div>
          <p className="mt-4 text-3xl font-semibold text-[#1E293B]">
            INR {Number(data.revenue?.net || 0).toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-xs font-medium text-violet-600">
            {data.revenue?.count || 0} payments
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[#64748B]">Active clients</p>
            <UsersRound size={20} className="text-violet-500" />
          </div>
          <p className="mt-4 text-3xl font-semibold text-[#1E293B]">{data.activeClients}</p>
          <p className="mt-1 text-xs font-medium text-violet-600">Current</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[#64748B]">No-show rate</p>
            <Activity size={20} className="text-violet-500" />
          </div>
          <p className="mt-4 text-3xl font-semibold text-[#1E293B]">
            {Number(data.noShowRate || 0).toFixed(1)}%
          </p>
          <p className="mt-1 text-xs font-medium text-violet-600">All sessions</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-7">
          <p className="text-sm font-bold uppercase tracking-[.15em] text-[#64748B]">Revenue trend</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-[#1E293B]">Monthly net revenue</h2>
        </div>
        <div className="h-72 w-full">
          {revenueTrend.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#E2E8F0" strokeOpacity={0.5} vertical={false} />
                <XAxis dataKey="_id" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip
                  formatter={(value) => [`INR ${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    padding: '8px 12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#7C3AED"
                  fill="url(#revenueFill)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-2xl bg-[#F8FAFC] text-sm text-[#64748B]">
              Revenue data will appear after successful payments.
            </div>
          )}
        </div>
      </section>

      {/* Upgrade prompt for advanced analytics */}
      {!data.advancedAnalytics && <UpgradePrompt feature="Detailed analytics" />}
    </section>
  )
}