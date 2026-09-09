import {
  ArrowDown,
  ArrowUp,
  Search,
  Users,
  UserPlus,
  CheckCircle,
  Clock,
  XCircle,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../api/axiosInstance'
import PageBackButton from '../../components/common/PageBackButton'

export default function Clients() {
  const navigate = useNavigate()

  const [leads, setLeads] = useState([])
  const [clients, setClients] = useState([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState({
    field: 'name',
    direction: 'asc',
  })

  const [state, setState] = useState({
    loading: true,
    error: '',
  })

  async function loadClients() {
    try {
      const [leadResponse, clientResponse] = await Promise.all([
        axiosInstance.get('/leads'),
        axiosInstance.get('/clients'),
      ])

      setLeads(leadResponse.data.leads || [])
      setClients(clientResponse.data.clients || [])

      setState({
        loading: false,
        error: '',
      })
    } catch (requestError) {
      setState({
        loading: false,
        error:
          requestError.response?.data?.message ||
          'Unable to load clients.',
      })
    }
  }

  useEffect(() => {
    loadClients()
  }, [])

  async function acceptLead(id) {
    try {
      await axiosInstance.patch(`/leads/${id}/accept`)
      await loadClients()
    } catch (requestError) {
      setState((current) => ({
        ...current,
        error:
          requestError.response?.data?.message ||
          'Unable to approve this request.',
      }))
    }
  }

  function changeSort(field) {
    setSort((current) => ({
      field,
      direction:
        current.field === field && current.direction === 'asc'
          ? 'desc'
          : 'asc',
    }))
  }

  const visibleClients = useMemo(
    () =>
      clients
        .filter(
          (client) =>
            (!status || client.status === status) &&
            (!query.trim() ||
              `${client.name} ${client.email || ''} ${(client.tags || []).join(
                ' '
              )}`
                .toLowerCase()
                .includes(query.toLowerCase()))
        )
        .sort((left, right) => {
          const leftValue =
            sort.field === 'last_session'
              ? left.last_session || ''
              : left[sort.field] || ''

          const rightValue =
            sort.field === 'last_session'
              ? right.last_session || ''
              : right[sort.field] || ''

          return (
            String(leftValue).localeCompare(String(rightValue)) *
            (sort.direction === 'asc' ? 1 : -1)
          )
        }),
    [clients, query, sort, status]
  )

  const totalClients = clients.length
  const activeClients = clients.filter(
    (client) => client.status === 'active'
  ).length
  const pendingLeads = leads.length

  const SortButton = ({ field, children }) => (
    <button
      type="button"
      onClick={() => changeSort(field)}
      className="group inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#64748B] transition-colors duration-200 hover:text-violet-600"
    >
      {children}

      {sort.field === field ? (
        sort.direction === 'asc' ? (
          <ArrowUp
            size={13}
            className="text-violet-500 transition-transform duration-200"
          />
        ) : (
          <ArrowDown
            size={13}
            className="text-violet-500 transition-transform duration-200"
          />
        )
      ) : (
        <span className="opacity-0 transition-opacity group-hover:opacity-40">
          <ArrowUp size={13} />
        </span>
      )}
    </button>
  )

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#FAFAF9] text-[#1E293B]">
      {/* Decorative background */}
      <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-violet-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -left-40 top-[45%] h-80 w-80 rounded-full bg-purple-200/20 blur-3xl" />

      <div className="relative mx-auto max-w-[1440px] space-y-10 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        <PageBackButton to="/dashboard" label="Back to dashboard" />

        {/* Header */}
        <header className="animate-[fadeSlideDown_.6s_ease-out] flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[.16em] text-violet-600">
              <Sparkles size={13} />
              Practice
            </div>

            <h1 className="font-display text-4xl font-semibold tracking-[-0.04em] text-[#1E293B] sm:text-5xl">
              Your clients
            </h1>

            <p className="mt-3 max-w-xl text-base leading-7 text-[#64748B]">
              Review access requests, keep track of your clients, and manage
              your practice relationships.
            </p>
          </div>

          <div className="hidden rounded-2xl border border-violet-100 bg-violet-50/70 px-5 py-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-100/40 sm:block">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-600">
              Active clients
            </p>

            <p className="mt-1 font-display text-2xl font-semibold text-[#1E293B]">
              {activeClients}
            </p>
          </div>
        </header>

        {/* Error */}
        {state.error && (
          <div className="flex animate-[fadeSlideDown_.4s_ease-out] items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            <XCircle size={18} />
            {state.error}
          </div>
        )}

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total clients"
            value={totalClients}
            icon={Users}
            description="All client records"
            delay={0}
          />
          <StatCard
            label="Active clients"
            value={activeClients}
            icon={CheckCircle}
            description="Currently active"
            delay={100}
          />
          <StatCard
            label="Pending requests"
            value={pendingLeads}
            icon={UserPlus}
            description="Awaiting approval"
            highlight={pendingLeads > 0}
            delay={200}
          />
        </section>

        {/* Pending requests */}
        <section className="animate-[fadeSlideUp_.6s_.3s_ease-out]">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
                New requests
              </p>

              <h2 className="mt-1 font-display text-2xl font-semibold text-[#1E293B]">
                Pending access
              </h2>
            </div>

            {pendingLeads > 0 && (
              <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
                {pendingLeads} pending
              </span>
            )}
          </div>

          <div className="space-y-3">
            {!state.loading && !leads.length && (
              <div className="flex items-center gap-4 rounded-[24px] border border-dashed border-slate-200 bg-white p-6 transition-all duration-300 hover:border-violet-300 hover:bg-violet-50/20">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition-colors group-hover:bg-violet-100 group-hover:text-violet-600">
                  <CheckCircle size={20} />
                </div>

                <div>
                  <p className="font-semibold text-[#1E293B]">
                    You're all caught up
                  </p>
                  <p className="mt-1 text-sm text-[#64748B]">
                    There are no pending client access requests.
                  </p>
                </div>
              </div>
            )}

            {leads.map((lead, index) => (
              <div
                key={lead._id}
                className="group flex flex-col justify-between gap-5 rounded-[24px] border border-violet-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_12px_35px_rgba(124,58,237,0.08)] sm:flex-row sm:items-center"
                style={{
                  animation: `fadeSlideUp 0.4s ease-out ${index * 80 + 350}ms both`,
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 font-display text-lg font-semibold text-violet-600 transition-colors duration-200 group-hover:bg-violet-100">
                    {lead.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[#1E293B]">
                        {lead.name}
                      </p>

                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-600">
                        <Clock size={11} />
                        Pending
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-[#64748B]">
                      {lead.email}
                      {lead.phone ? ` · ${lead.phone}` : ''}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => acceptLead(lead._id)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-300 active:scale-[0.98]"
                >
                  Approve access
                  <ChevronRight size={15} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Client directory */}
        <section className="animate-[fadeSlideUp_.6s_.4s_ease-out]">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
                Directory
              </p>

              <h2 className="mt-1 font-display text-2xl font-semibold text-[#1E293B]">
                Client directory
              </h2>

              <p className="mt-1 text-sm text-[#64748B]">
                Search, filter, and organize your client records.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="group relative">
                <Search
                  size={16}
                  className="absolute left-3.5 top-3 text-[#94A3B8] transition-colors duration-200 group-focus-within:text-violet-500"
                />

                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search clients..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-[#1E293B] shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 sm:w-64"
                />
              </label>

              <label className="relative">
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-medium text-[#1E293B] shadow-sm outline-none transition-all duration-200 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 sm:w-40"
                >
                  <option value="">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>
          </div>

          {/* Directory */}
          <div className="mt-5 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.04)] transition-all duration-300 hover:border-violet-200 hover:shadow-[0_16px_50px_rgba(124,58,237,0.08)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="border-b border-slate-200 bg-[#F8FAFC]">
                  <tr>
                    <th className="px-6 py-4">
                      <SortButton field="name">Client</SortButton>
                    </th>

                    <th className="px-6 py-4">
                      <SortButton field="last_session">
                        Last session
                      </SortButton>
                    </th>

                    <th className="px-6 py-4">
                      <SortButton field="status">Status</SortButton>
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.12em] text-[#64748B]">
                      Tags
                    </th>

                    <th className="w-10 px-4" />
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {visibleClients.map((client, index) => (
                    <tr
                      key={client._id}
                      onClick={() => navigate(`/clients/${client._id}`)}
                      className="group cursor-pointer transition-all duration-200 hover:bg-violet-50/40"
                      style={{
                        animation: `fadeSlideUp 0.3s ease-out ${index * 40 + 450}ms both`,
                      }}
                    >
                      {/* Client */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 font-semibold text-violet-600 transition-all duration-200 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-violet-100 group-hover:text-violet-700">
                            {client.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>

                          <div>
                            <p className="font-semibold text-[#1E293B]">
                              {client.name}
                            </p>

                            <p className="mt-1 text-xs text-[#64748B]">
                              {client.email || 'No email'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Last session */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-sm text-[#64748B]">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 transition-colors group-hover:bg-violet-100 group-hover:text-violet-600">
                            <Clock size={13} />
                          </span>

                          {client.last_session
                            ? new Date(
                                client.last_session
                              ).toLocaleDateString()
                            : 'No sessions'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold capitalize transition-colors duration-200 ${
                            client.status === 'active'
                              ? 'bg-violet-100 text-violet-700 group-hover:bg-violet-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              client.status === 'active'
                                ? 'bg-violet-500'
                                : 'bg-slate-400'
                            }`}
                          />

                          {client.status || 'active'}
                        </span>
                      </td>

                      {/* Tags */}
                      <td className="px-6 py-5">
                        {client.tags?.length ? (
                          <div className="flex max-w-xs flex-wrap gap-1.5">
                            {client.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors group-hover:bg-violet-100 group-hover:text-violet-700"
                              >
                                {tag}
                              </span>
                            ))}

                            {client.tags.length > 3 && (
                              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                                +{client.tags.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">
                            No tags
                          </span>
                        )}
                      </td>

                      {/* Arrow */}
                      <td className="px-4 py-5">
                        <ChevronRight
                          size={18}
                          className="text-slate-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-violet-500"
                        />
                      </td>
                    </tr>
                  ))}

                  {!visibleClients.length && (
                    <tr>
                      <td colSpan="5" className="px-6 py-14">
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                            <Users size={24} />
                          </div>

                          <p className="mt-4 font-semibold text-[#1E293B]">
                            No clients found
                          </p>

                          <p className="mt-1 max-w-sm text-sm text-[#64748B]">
                            Try changing your search or status filter to find
                            the client you're looking for.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            {visibleClients.length > 0 && (
              <div className="flex items-center justify-between border-t border-slate-100 bg-[#FCFCFD] px-6 py-4">
                <p className="text-xs font-medium text-[#64748B]">
                  Showing{' '}
                  <span className="font-bold text-[#1E293B]">
                    {visibleClients.length}
                  </span>{' '}
                  of{' '}
                  <span className="font-bold text-[#1E293B]">
                    {totalClients}
                  </span>{' '}
                  clients
                </p>

                <span className="hidden text-xs text-slate-400 sm:block">
                  Click a client to view their profile
                </span>
              </div>
            )}
          </div>
        </section>
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

/* ---------------------------------------------
   Stat Card
--------------------------------------------- */

function StatCard({
  label,
  value,
  icon: Icon,
  description,
  highlight = false,
  delay = 0,
}) {
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className="group relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm opacity-0 animate-[fadeSlideUp_.6s_ease-out_forwards] transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_14px_40px_rgba(124,58,237,0.08)]"
    >
      {/* Small accent */}
      <div className="absolute right-0 top-0 h-20 w-20 rounded-bl-full bg-violet-50 opacity-70 transition-transform duration-300 group-hover:scale-125" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[#64748B]">{label}</p>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-500 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-violet-100">
            <Icon size={19} />
          </div>
        </div>

        <p className="mt-5 font-display text-3xl font-semibold tracking-tight text-[#1E293B]">
          {value}
        </p>

        <div className="mt-2 flex items-center gap-1.5">
          {highlight ? (
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
          )}

          <p
            className={`text-xs font-semibold ${
              highlight ? 'text-amber-600' : 'text-violet-600'
            }`}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}