import { useEffect, useState } from 'react'
import axiosInstance from '../../api/axiosInstance'

export default function Clients() {
	const [leads, setLeads] = useState([])
	const [clients, setClients] = useState([])
	const [state, setState] = useState({ loading: true, error: '' })

	async function loadClients() {
		try {
			const [leadResponse, clientResponse] = await Promise.all([axiosInstance.get('/leads'), axiosInstance.get('/clients')])
			setLeads(leadResponse.data.leads)
			setClients(clientResponse.data.clients)
			setState({ loading: false, error: '' })
		} catch (requestError) {
			setState({ loading: false, error: requestError.response?.data?.message || 'Unable to load clients.' })
		}
	}

	useEffect(() => { loadClients() }, [])

	async function acceptLead(id) {
		try {
			await axiosInstance.patch(`/leads/${id}/accept`)
			await loadClients()
		} catch (requestError) {
			setState((current) => ({ ...current, error: requestError.response?.data?.message || 'Unable to approve this request.' }))
		}
	}

	return <section className="space-y-8"><div><h1 className="font-display text-3xl font-semibold">Clients</h1><p className="mt-2 text-ink/60">Review access requests and manage your approved clients.</p></div>{state.error && <p className="rounded-xl bg-[#fae2d9] px-4 py-3 text-sm font-medium text-[#9a4932]">{state.error}</p>}<div><h2 className="font-display text-2xl font-semibold">Pending access requests</h2><div className="mt-4 space-y-3">{!state.loading && leads.length === 0 && <p className="rounded-2xl border border-ink/10 bg-white p-5 text-sm text-ink/55">No pending requests.</p>}{leads.map((lead) => <div key={lead._id} className="flex flex-col justify-between gap-4 rounded-2xl border border-ink/10 bg-white p-5 sm:flex-row sm:items-center"><div><p className="font-semibold">{lead.name}</p><p className="mt-1 text-sm text-ink/55">{lead.email}{lead.phone ? ` · ${lead.phone}` : ''}</p>{lead.presenting_concern && <p className="mt-2 text-sm text-ink/65">{lead.presenting_concern}</p>}</div><button type="button" onClick={() => acceptLead(lead._id)} className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white hover:bg-moss">Approve access</button></div>)}</div></div><div><h2 className="font-display text-2xl font-semibold">Approved clients</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{clients.map((client) => <div key={client._id} className="rounded-2xl border border-ink/10 bg-white p-5"><p className="font-semibold">{client.name}</p><p className="mt-1 text-sm text-ink/55">{client.email || 'No email provided'}</p></div>)}</div></div></section>
}