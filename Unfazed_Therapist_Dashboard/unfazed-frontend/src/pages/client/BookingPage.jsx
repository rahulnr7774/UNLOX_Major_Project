import { useEffect, useState } from 'react'
import { ArrowLeft, CalendarDays, Check, Clock3, CreditCard, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../api/axiosInstance'

const durations = [30, 45, 60, 90]

export default function BookingPage() {
  const navigate = useNavigate()
  const [therapists, setTherapists] = useState([])
  const [specialization, setSpecialization] = useState('')
  const [therapist, setTherapist] = useState(null)
  const [date, setDate] = useState('')
  const [duration, setDuration] = useState(60)
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [slotLoading, setSlotLoading] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [activePackage, setActivePackage] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    axiosInstance.get('/client-booking/therapists')
      .then(({ data }) => setTherapists(data.therapists || []))
      .catch((error) => setMessage(error.response?.data?.message || 'Unable to load therapists.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    axiosInstance.get('/clients/portal').then(({ data }) => setActivePackage(data.clientPackage)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!therapist || !date) return
    let cancelled = false
    setSelectedSlot(null)
    const loadSlots = (showLoading) => {
      if (showLoading) setSlotLoading(true)
      axiosInstance.get(`/client-booking/therapists/${therapist._id}/availability`, { params: { date, duration, _: Date.now() } })
        .then(({ data }) => {
          if (cancelled) return
          const nextSlots = data.slots || []
          setSlots(nextSlots)
          setSelectedSlot((current) => current && nextSlots.some((slot) => slot.start === current.start) ? current : null)
        })
        .catch((error) => {
          if (cancelled) return
          setSlots([])
          setMessage(error.response?.data?.message || 'Unable to load availability.')
        })
        .finally(() => { if (!cancelled && showLoading) setSlotLoading(false) })
    }
    loadSlots(true)
    const refreshTimer = window.setInterval(() => loadSlots(false), 5000)
    return () => { cancelled = true; window.clearInterval(refreshTimer) }
  }, [therapist, date, duration])

  const filteredTherapists = therapists.filter((item) => !specialization.trim() || item.specializations?.some((value) => value.toLowerCase().includes(specialization.trim().toLowerCase())))

  async function verifyPayment(orderData, result) {
    const { data } = await axiosInstance.post('/client-booking/verify', {
      payment_id: orderData.payment._id,
      razorpay_order_id: orderData.order.id,
      razorpay_payment_id: result.razorpay_payment_id,
      razorpay_signature: result.razorpay_signature,
      payment_method: 'razorpay'
    })
    navigate('/client-portal')
  }

  async function payAndBook() {
    if (!therapist || !selectedSlot) return
    setPaymentLoading(true)
    setMessage('')
    try {
      const { data } = await axiosInstance.post('/client-booking/orders', {
        therapist_id: therapist._id,
        starts_at: selectedSlot.start,
        ends_at: selectedSlot.end,
        duration
      })

      if (!window.Razorpay) {
        throw new Error('Payment gateway is not loaded. Please configure Razorpay before booking.')
      }
      if (!import.meta.env.VITE_RAZORPAY_KEY_ID) {
        throw new Error('Razorpay is not configured. Please add VITE_RAZORPAY_KEY_ID.')
      }

      const checkout = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'Unfazed',
        description: `Session with ${therapist.name}`,
        order_id: data.order.id,
        handler: (result) => verifyPayment(data, result),
        theme: { color: '#486653' }
      })
      checkout.open()
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || 'Payment failed. The session was not booked.')
    } finally {
      setPaymentLoading(false)
    }
  }

  async function bookWithPackage() {
    if (!therapist || !selectedSlot || !activePackage) return
    setPaymentLoading(true)
    try {
      const { data } = await axiosInstance.post('/client-booking/package-book', {
        package_id: activePackage._id,
        therapist_id: therapist._id,
        starts_at: selectedSlot.start,
        ends_at: selectedSlot.end
      })
      navigate('/client-portal')
      return data
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to use your package for this session.')
    } finally {
      setPaymentLoading(false)
    }
  }

  return <main className="min-h-screen bg-cream text-ink"><div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-12">
    <button onClick={() => navigate(-1)} className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-ink/55 hover:text-ink"><ArrowLeft size={16} /> Back</button>
    <header className="mb-10"><p className="mb-3 text-sm font-semibold uppercase tracking-[.18em] text-moss">Find your fit</p><h1 className="font-display text-4xl font-semibold tracking-[-.04em] sm:text-5xl">Book a session</h1><p className="mt-3 max-w-xl text-base leading-7 text-ink/60">Choose a therapist, find an available time, and pay for one session securely.</p></header>
    {message && <p className="mb-6 rounded-xl bg-[#fae2d9] px-4 py-3 text-sm font-medium text-[#9a4932]">{message}</p>}
    <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
      <section className="rounded-[28px] border border-ink/10 bg-white p-6 sm:p-8"><p className="text-sm font-semibold uppercase tracking-[.15em] text-ink/45">Step 1</p><h2 className="mt-2 font-display text-2xl font-semibold">Choose a therapist</h2><label className="relative mt-6 block"><Search size={17} className="absolute left-4 top-3.5 text-ink/35" /><input value={specialization} onChange={(event) => setSpecialization(event.target.value)} placeholder="Filter by specialization" className="h-11 w-full rounded-xl border border-ink/10 bg-cream pl-11 pr-4 text-sm outline-none focus:border-moss" /></label><div className="mt-5 space-y-3">{loading && <p className="text-sm text-ink/55">Loading therapists...</p>}{!loading && !filteredTherapists.length && <p className="rounded-2xl border border-dashed border-ink/15 p-5 text-sm text-ink/55">No therapists match that specialization.</p>}{filteredTherapists.map((item) => <button type="button" key={item._id} onClick={() => { setTherapist(item); setDate(''); setSlots([]) }} className={`w-full rounded-2xl border p-4 text-left transition ${therapist?._id === item._id ? 'border-moss bg-sage/60' : 'border-ink/10 hover:border-moss/50 hover:bg-cream'}`}><span className="flex items-start justify-between gap-3"><span><strong className="block font-display text-lg">{item.name}</strong><span className="mt-1 block text-sm text-ink/55">{item.specializations?.join(' · ') || 'General therapy'}</span></span>{therapist?._id === item._id && <Check className="text-moss" size={20} />}</span><span className="mt-3 block text-sm font-bold text-moss">INR {item.session_rate || 1500} / session</span></button>)}</div></section>
      <div className="space-y-6"><section className="rounded-[28px] border border-ink/10 bg-white p-6 sm:p-8"><p className="text-sm font-semibold uppercase tracking-[.15em] text-ink/45">Step 2</p><h2 className="mt-2 font-display text-2xl font-semibold">Find a time</h2>{therapist ? <><div className="mt-6 flex flex-wrap gap-2">{durations.map((item) => <button type="button" key={item} onClick={() => setDuration(item)} className={`rounded-full px-4 py-2 text-sm font-bold ${duration === item ? 'bg-ink text-white' : 'bg-cream text-ink/60 hover:text-ink'}`}>{item} min</button>)}</div><input type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(event) => setDate(event.target.value)} className="mt-6 h-11 w-full rounded-xl border border-ink/10 bg-cream px-4 text-sm outline-none focus:border-moss" />{date && <div className="mt-6"><p className="mb-3 flex items-center gap-2 text-sm font-bold"><Clock3 size={16} className="text-moss" /> Available times</p>{slotLoading && <p className="text-sm text-ink/55">Checking availability...</p>}{!slotLoading && !slots.length && <p className="text-sm text-ink/55">No available times for this date.</p>}<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{slots.map((slot) => <button type="button" key={slot.start} onClick={() => setSelectedSlot(slot)} className={`rounded-xl border px-3 py-3 text-sm font-semibold ${selectedSlot?.start === slot.start ? 'border-moss bg-sage text-moss' : 'border-ink/10 hover:border-moss'}`}>{slot.displayTime}</button>)}</div></div>}</> : <p className="mt-6 rounded-2xl border border-dashed border-ink/15 p-5 text-sm text-ink/55">Select a therapist first to see availability.</p>}</section>
      <section className="rounded-[28px] border border-moss/10 bg-sage p-6 sm:p-8"><p className="text-sm font-semibold uppercase tracking-[.15em] text-moss">Step 3</p><h2 className="mt-2 font-display text-2xl font-semibold">Confirm booking</h2>{therapist && selectedSlot ? <><div className="mt-5 space-y-2 text-sm text-ink/65"><p><strong>Therapist:</strong> {therapist.name}</p><p><strong>When:</strong> {new Date(selectedSlot.start).toLocaleString()}</p><p><strong>Duration:</strong> {duration} minutes</p>{activePackage?.therapist_id === therapist._id && activePackage.sessions_remaining > 0 ? <button type="button" disabled={paymentLoading} onClick={bookWithPackage} className="mt-5 w-full rounded-full bg-moss px-5 py-3 text-sm font-bold text-white hover:bg-ink disabled:opacity-50">Use package session ({activePackage.sessions_remaining} left)</button> : <><p className="pt-2 font-display text-2xl font-semibold text-ink">INR {therapist.session_rate || 1500}</p><button type="button" disabled={paymentLoading} onClick={payAndBook} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white hover:bg-moss disabled:cursor-not-allowed disabled:opacity-50"><CreditCard size={17} />{paymentLoading ? 'Processing...' : 'Pay and book session'}</button></>}</div><p className="mt-3 text-xs leading-5 text-ink/50">A package booking uses one remaining session. Otherwise, the session is created only after payment verification succeeds.</p></> : <p className="mt-5 text-sm text-ink/55">Choose a therapist and time to continue.</p>}</section></div>
    </div>
  </div></main>
}
