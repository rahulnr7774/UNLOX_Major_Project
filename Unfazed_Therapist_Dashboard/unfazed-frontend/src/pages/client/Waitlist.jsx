import { useEffect, useState } from 'react'
import { Bell, CalendarClock, Clock3, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import axiosInstance from '../../api/axiosInstance'

export default function Waitlist() {
  const [waitlist, setWaitlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    axiosInstance.get('/client-booking/waitlist')
      .then(({ data }) => setWaitlist(data.waitlist || []))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load your waitlist.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="mx-auto max-w-[1100px] space-y-8 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
      <header>
        <p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-600">Your requests</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-.04em] text-[#1E293B]">Waitlist</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#64748B]">We will email you when your therapist opens a matching session.</p>
      </header>

      {error && <p className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">{error}</p>}
      {loading && <p className="flex items-center gap-2 text-sm text-[#64748B]"><RefreshCw size={16} className="animate-spin" /> Loading your waitlist...</p>}
      {!loading && !waitlist.length && <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-12 text-center"><CalendarClock size={30} className="mx-auto text-emerald-400" /><h2 className="mt-4 font-display text-xl font-semibold">Nothing on your waitlist</h2><p className="mt-2 text-sm text-[#64748B]">When a date has no available times, join the waitlist from Book a session.</p><Link to="/client/book" className="mt-5 inline-flex rounded-full bg-emerald-500 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-600">Book a session</Link></div>}

      <div className="space-y-4">
        {waitlist.map((entry) => {
          const notified = entry.status === 'notified'
          const cancelled = entry.status === 'cancelled'
          return (
            <article key={entry._id} className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-display text-xl font-semibold text-[#1E293B]">{entry.therapist?.name || 'Your therapist'}</h2>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#64748B]">
                    <span className="inline-flex items-center gap-2"><CalendarClock size={15} />{entry.date}</span>
                    <span className="inline-flex items-center gap-2"><Clock3 size={15} />{entry.duration} minutes</span>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${notified ? 'bg-emerald-50 text-emerald-700' : cancelled ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-700'}`}><Bell size={14} />{notified ? 'Slot available, check your email' : cancelled ? 'Request closed by therapist' : 'Waiting for a slot'}</span>
              </div>
              {notified && <Link to="/client/book" className="mt-5 inline-flex rounded-full bg-emerald-500 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-600">Book your session</Link>}
            </article>
          )
        })}
      </div>
    </section>
  )
}
