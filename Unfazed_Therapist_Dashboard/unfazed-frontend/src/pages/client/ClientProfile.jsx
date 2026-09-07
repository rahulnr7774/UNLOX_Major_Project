import { ArrowLeft, CalendarDays, Mail, Phone, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../api/axiosInstance'

export default function ClientProfile() {
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    axiosInstance.get('/clients/portal')
      .then(({ data }) => setClient(data.client))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load your profile.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-cream text-sm text-ink/60">Loading your profile...</main>
  if (error || !client) return <main className="flex min-h-screen items-center justify-center bg-cream px-6 text-center"><div><p className="text-sm text-[#9a4932]">{error || 'Profile unavailable.'}</p><button onClick={() => navigate('/client-portal')} className="mt-5 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white">Back to portal</button></div></main>

  return <main className="min-h-screen bg-cream px-5 py-8 text-ink sm:px-8 lg:py-12"><div className="mx-auto max-w-3xl"><button onClick={() => navigate('/client-portal')} className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-ink/55 hover:text-ink"><ArrowLeft size={16} /> Back to portal</button><section className="rounded-[28px] border border-ink/10 bg-white p-6 shadow-[0_20px_60px_rgba(31,41,36,.05)] sm:p-10"><div className="flex flex-col gap-5 border-b border-ink/10 pb-8 sm:flex-row sm:items-center"><div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-sage text-moss"><UserRound size={30} /></div><div><p className="text-xs font-bold uppercase tracking-[.16em] text-moss">Your profile</p><h1 className="mt-1 font-display text-3xl font-semibold">{client.name}</h1><p className="mt-2 text-sm capitalize text-ink/55">{client.status || 'active'} client</p></div></div><div className="mt-8 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl bg-cream p-5"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-ink/45"><Mail size={15} /> Email</p><p className="mt-3 text-sm font-semibold">{client.email || 'Not provided'}</p></div><div className="rounded-2xl bg-cream p-5"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-ink/45"><Phone size={15} /> Phone</p><p className="mt-3 text-sm font-semibold">{client.phone || 'Not provided'}</p></div><div className="rounded-2xl bg-cream p-5"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-ink/45"><CalendarDays size={15} /> Date of birth</p><p className="mt-3 text-sm font-semibold">{client.date_of_birth ? new Date(client.date_of_birth).toLocaleDateString() : 'Not provided'}</p></div><div className="rounded-2xl bg-cream p-5"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-ink/45"><UserRound size={15} /> Gender</p><p className="mt-3 text-sm font-semibold capitalize">{client.gender || 'Not provided'}</p></div></div><div className="mt-8"><p className="text-xs font-bold uppercase tracking-[.16em] text-moss">Presenting concern</p><p className="mt-3 whitespace-pre-line rounded-2xl border border-ink/10 p-5 text-sm leading-7 text-ink/65">{client.presenting_concern || 'No presenting concern has been added yet.'}</p></div></section></div></main>
}
