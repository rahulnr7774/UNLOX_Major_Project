import { ArrowDown, ArrowUp, Search, Users, UserPlus, Filter, CheckCircle, Clock, XCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../api/axiosInstance'

export default function Clients() {
  const navigate = useNavigate()
  const [leads, setLeads] = useState([])
  const [clients, setClients] = useState([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState({ field: 'name', direction: 'asc' })
  const [state, setState] = useState({ loading: true, error: '' })

  async function loadClients() {
    try {
      const [leadResponse, clientResponse] = await Promise.all([
        axiosInstance.get('/leads'),
        axiosInstance.get('/clients'),
      ])
      setLeads(leadResponse.data.leads || [])
      setClients(clientResponse.data.clients || [])
      setState({ loading: false, error: '' })
    } catch (requestError) {
      setState({
        loading: false,
        error: requestError.response?.data?.message || 'Unable to load clients.',
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
        error: requestError.response?.data?.message || 'Unable to approve this request.',
      }))
    }
  }

  function changeSort(field) {
    setSort((current) => ({
      field,
      direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const visibleClients = useMemo(
    () =>
      clients
        .filter(
          (client) =>
            (!status || client.status === status) &&
            (!query.trim() ||
              `${client.name} ${client.email || ''} ${(client.tags || []).join(' ')}`
                .toLowerCase()
                .includes(query.toLowerCase()))
        )
        .sort((left, right) => {
          const leftValue =
            sort.field === 'last_session' ? left.last_session || '' : left[sort.field] || ''
          const rightValue =
            sort.field === 'last_session' ? right.last_session || '' : right[sort.field] || ''
          return (
            String(leftValue).localeCompare(String(rightValue)) *
            (sort.direction === 'asc' ? 1 : -1)
          )
        }),
    [clients, query, sort, status]
  )

  const SortButton = ({ field, children }) => (
    <button
      type="button"
      onClick={() => changeSort(field)}
      className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#64748B] transition-colors hover:text-[#1E293B]"
    >
      {children}
      {sort.field === field &&
        (sort.direction === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
    </button>
  )

  const totalClients = clients.length
  const activeClients = clients.filter((c) => c.status === 'active').length
  const pendingLeads = leads.length

  return (
    <section className="mx-auto max-w-[1440px] space-y-10 px-5 py-8 sm:px-8 lg:px-12">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-semibold text-[#1E293B]">Clients</h1>
        <p className="mt-2 text-[#64748B]">
          Review access requests and manage your client records.
        </p>
      </div>

      {state.error && (
        <p className="rounded-xl bg-red-100 px-4 py-3 text-sm font-medium text-red-700">
          {state.error}
        </p>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[#64748B]">Total Clients</p>
            <Users size={20} className="text-violet-500" />
          </div>
          <p className="mt-4 text-3xl font-semibold text-[#1E293B]">{totalClients}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[#64748B]">Active Clients</p>
            <CheckCircle size={20} className="text-violet-500" />
          </div>
          <p className="mt-4 text-3xl font-semibold text-[#1E293B]">{activeClients}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[#64748B]">Pending Requests</p>
            <UserPlus size={20} className="text-violet-500" />
          </div>
          <p className="mt-4 text-3xl font-semibold text-[#1E293B]">{pendingLeads}</p>
        </div>
      </div>

      {/* Pending requests */}
      <div>
        <h2 className="font-display text-2xl font-semibold text-[#1E293B]">
          Pending access requests
        </h2>
        <div className="mt-4 space-y-3">
          {!state.loading && !leads.length && (
            <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-[#64748B] shadow-sm">
              No pending requests.
            </p>
          )}
          {leads.map((lead) => (
            <div
              key={lead._id}
              className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center"
            >
              <div>
                <p className="font-semibold text-[#1E293B]">{lead.name}</p>
                <p className="mt-1 text-sm text-[#64748B]">
                  {lead.email}
                  {lead.phone ? ` · ${lead.phone}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => acceptLead(lead._id)}
                className="rounded-full bg-violet-500 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-violet-600"
              >
                Approve access
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Client directory */}
      <div>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#1E293B]">
              Client directory
            </h2>
            <p className="mt-1 text-sm text-[#64748B]">
              Filter and sort your active records.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="relative">
              <Search size={16} className="absolute left-3 top-3 text-[#64748B]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search clients"
                className="h-10 w-48 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-[#1E293B] outline-none transition-colors focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              />
            </label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-[#1E293B] outline-none transition-colors focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[680px] text-left">
            <thead className="border-b border-slate-200 bg-[#F8FAFC]">
              <tr>
                <th className="px-6 py-4">
                  <SortButton field="name">Name</SortButton>
                </th>
                <th className="px-6 py-4">
                  <SortButton field="last_session">Last session</SortButton>
                </th>
                <th className="px-6 py-4">
                  <SortButton field="status">Status</SortButton>
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Tags
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {visibleClients.map((client) => (
                <tr
                  key={client._id}
                  onClick={() => navigate(`/clients/${client._id}`)}
                  className="cursor-pointer transition-colors hover:bg-[#F8FAFC]"
                >
                  <td className="px-6 py-4">
                    <p className="font-semibold text-[#1E293B]">{client.name}</p>
                    <p className="mt-1 text-xs text-[#64748B]">
                      {client.email || 'No email'}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#64748B]">
                    {client.last_session
                      ? new Date(client.last_session).toLocaleDateString()
                      : 'No sessions'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                        client.status === 'active'
                          ? 'bg-violet-100 text-violet-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {client.status || 'active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#64748B]">
                    {client.tags?.length ? client.tags.join(' · ') : 'None'}
                  </td>
                </tr>
              ))}
              {!visibleClients.length && (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-sm text-[#64748B]">
                    No clients match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}