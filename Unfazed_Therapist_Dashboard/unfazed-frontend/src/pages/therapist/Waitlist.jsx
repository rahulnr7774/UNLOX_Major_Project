import { useEffect, useState } from 'react'
import { CalendarClock, Clock3, Mail, RefreshCw, UserRound, XCircle } from 'lucide-react'
import axiosInstance from '../../api/axiosInstance'
import PageBackButton from '../../components/common/PageBackButton'

export default function Waitlist() {
  const [waitlist, setWaitlist] = useState([])
  const [times, setTimes] = useState({})
  const [durations, setDurations] = useState({})
  const [loading, setLoading] = useState(true)
  const [openingId, setOpeningId] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function loadWaitlist() {
    try {
      const { data } = await axiosInstance.get('/scheduling/waitlist')
      setWaitlist(data.waitlist || [])
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load the waitlist.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWaitlist()
  }, [])

  async function openSlot(entry) {
    const startTime = times[entry._id]
    const duration = Number(durations[entry._id] || entry.duration)
    if (!startTime) {
      setError('Choose a start time before opening the session.')
      return
    }

    const [hours, minutes] = startTime.split(':').map(Number)
    const endDate = new Date(2000, 0, 1, hours, minutes + duration)
    const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`

    try {
      setOpeningId(entry._id)
      setError('')
      setMessage('')
      const { data } = await axiosInstance.patch(`/scheduling/waitlist/${entry._id}/open`, {
        start_time: startTime,
        end_time: endTime,
        duration,
      })
      setMessage(data.message || 'The session slot is open and the client was notified.')
      await loadWaitlist()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to open this session slot.')
    } finally {
      setOpeningId(null)
    }
  }

  async function cancelWaitlist(entry) {
    try {
      setCancellingId(entry._id)
      setError('')
      setMessage('')
      const { data } = await axiosInstance.patch(`/scheduling/waitlist/${entry._id}/cancel`)
      setMessage(data.message || 'The waitlist request was cancelled.')
      await loadWaitlist()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to cancel this waitlist request.')
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <section className="mx-auto max-w-[1100px] space-y-8 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
      <PageBackButton to="/dashboard" label="Back to dashboard" />
      <header>
        <p className="text-xs font-bold uppercase tracking-[.16em] text-violet-600">Client demand</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-.04em] text-[#1E293B]">Waitlist</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#64748B]">See who is waiting and open a matching session when your calendar has room.</p>
      </header>

      {message && <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">{message}</p>}
      {error && <p className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">{error}</p>}

      {loading && <p className="flex items-center gap-2 text-sm text-[#64748B]"><RefreshCw size={16} className="animate-spin" /> Loading waitlist...</p>}
      {!loading && !waitlist.length && <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-12 text-center"><CalendarClock size={30} className="mx-auto text-violet-400" /><h2 className="mt-4 font-display text-xl font-semibold">No waitlist requests</h2><p className="mt-2 text-sm text-[#64748B]">New requests will appear here when clients cannot find an available time.</p></div>}

      <div className="space-y-4">
        {waitlist.map((entry) => {
          const client = entry.client_id
          const waiting = entry.status === 'waiting'
          const cancelled = entry.status === 'cancelled'
          return (
            <article key={entry._id} className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl font-semibold text-[#1E293B]">{client?.name || 'Client'}</h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${waiting ? 'bg-amber-50 text-amber-700' : cancelled ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700'}`}>{waiting ? 'Waiting' : cancelled ? 'Cancelled' : 'Notified'}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#64748B]">
                    <span className="inline-flex items-center gap-2"><Mail size={15} />{client?.email || 'No email'}</span>
                    <span className="inline-flex items-center gap-2"><CalendarClock size={15} />{entry.date}</span>
                    <span className="inline-flex items-center gap-2"><Clock3 size={15} />{entry.duration} minutes</span>
                  </div>
                </div>
                {waiting && (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:flex-wrap">
                    <label className="text-xs font-bold uppercase tracking-[.12em] text-[#64748B]">Duration<select value={durations[entry._id] || entry.duration} onChange={(event) => setDurations((current) => ({ ...current, [entry._id]: Number(event.target.value) }))} className="mt-1 block h-11 rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 text-sm font-semibold text-[#1E293B] outline-none focus:border-violet-400"><option value={30}>30 minutes</option><option value={45}>45 minutes</option><option value={60}>60 minutes</option><option value={90}>90 minutes</option></select></label>
                    <label className="text-xs font-bold uppercase tracking-[.12em] text-[#64748B]">Start time<input type="time" value={times[entry._id] || ''} onChange={(event) => setTimes((current) => ({ ...current, [entry._id]: event.target.value }))} className="mt-1 block h-11 rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 text-sm font-semibold text-[#1E293B] outline-none focus:border-violet-400" /></label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openSlot(entry)} disabled={Boolean(openingId || cancellingId)} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-violet-500 px-5 text-sm font-bold text-white transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-50"><UserRound size={16} />{openingId === entry._id ? 'Opening...' : 'Open & notify'}</button>
                      <button type="button" onClick={() => cancelWaitlist(entry)} disabled={Boolean(openingId || cancellingId)} aria-label={`Cancel waitlist for ${client?.name || 'client'}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-rose-200 px-4 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"><XCircle size={16} />{cancellingId === entry._id ? 'Cancelling...' : 'Cancel'}</button>
                    </div>
                  </div>
                )}
              </div>
              {!waiting && !cancelled && <p className="mt-4 text-sm font-medium text-emerald-700">The client has been emailed that a matching session is available.</p>}
              {cancelled && <p className="mt-4 text-sm font-medium text-slate-500">This request was cancelled and the client was notified.</p>}
            </article>
          )
        })}
      </div>
    </section>
  )
}
