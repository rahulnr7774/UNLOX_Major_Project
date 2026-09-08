import { useEffect, useState } from 'react'
import { ArrowLeft, Calendar, Check, ChevronLeft, ChevronRight, Clock3, CreditCard, Leaf, Search, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../api/axiosInstance'

const durations = [30, 45, 60, 90]

function localDateKey(value) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function monthKey(value) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`
}

function calendarWeeksForMonth(value) {
  const [year, month] = value.split('-').map(Number)
  const firstDay = new Date(year, month - 1, 1)
  const start = new Date(firstDay)
  start.setDate(1 - firstDay.getDay())
  const weeks = []

  while (weeks.length < 6) {
    weeks.push(Array.from({ length: 7 }, (_, index) => {
      const day = new Date(start)
      day.setDate(start.getDate() + index)
      return day
    }))
    start.setDate(start.getDate() + 7)
  }

  return weeks
}

function DateBookingModal({ date, duration, slots, slotLoading, selectedSlot, therapist, activePackage, paymentLoading, waitlistLoading, onClose, onSelectSlot, onBook, onPackageBook, onWaitlist }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E293B]/40 p-5" role="dialog" aria-modal="true" aria-labelledby="date-booking-title">
      <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.15em] text-emerald-600">Choose your time</p>
            <h2 id="date-booking-title" className="mt-2 font-display text-2xl font-semibold text-[#1E293B]">
              {new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close booking dialog" className="rounded-full p-2 text-[#64748B] hover:bg-[#FAFAF9] hover:text-[#1E293B]">
            <X size={20} />
          </button>
        </div>
        <div className="mt-6">
          <p className="mb-3 flex items-center gap-2 text-sm font-bold text-[#1E293B]">
            <Clock3 size={16} className="text-emerald-500" /> Available times for {duration} minutes
          </p>
          {slotLoading && <p className="rounded-xl bg-[#FAFAF9] px-4 py-3 text-sm text-[#64748B]">Checking availability...</p>}
          {!slotLoading && slots.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {slots.map((slot) => (
                <button
                  type="button"
                  key={slot.start}
                  onClick={() => onSelectSlot(slot)}
                  className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${
                    selectedSlot?.start === slot.start
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                      : 'border-[#E2E8F0] hover:border-emerald-500'
                  }`}
                >
                  {slot.displayTime}
                </button>
              ))}
            </div>
          )}
          {!slotLoading && !slots.length && (
            <div className="rounded-xl bg-[#FAFAF9] px-4 py-4">
              <p className="text-sm text-[#64748B]">No available times for this date.</p>
              <button
                type="button"
                disabled={waitlistLoading}
                onClick={onWaitlist}
                className="mt-4 rounded-full bg-emerald-500 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
              >
                {waitlistLoading ? 'Joining...' : 'Join waitlist'}
              </button>
            </div>
          )}
        </div>
        {selectedSlot && (
          <div className="mt-6 border-t border-[#E2E8F0] pt-5">
            <p className="text-sm text-[#64748B]">
              Selected time: <strong className="text-[#1E293B]">{selectedSlot.displayTime}</strong>
            </p>
            {activePackage?.therapist_id === therapist._id && activePackage.sessions_remaining > 0 ? (
              <button
                type="button"
                disabled={paymentLoading}
                onClick={onPackageBook}
                className="mt-4 w-full rounded-full bg-emerald-500 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
              >
                {paymentLoading ? 'Booking...' : `Use package session (${activePackage.sessions_remaining} left)`}
              </button>
            ) : (
              <button
                type="button"
                disabled={paymentLoading}
                onClick={onBook}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1E293B] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
              >
                <CreditCard size={17} />
                {paymentLoading ? 'Processing...' : 'Pay and book session'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function BookingPage() {
  const navigate = useNavigate()
  const [therapists, setTherapists] = useState([])
  const [specialization, setSpecialization] = useState('')
  const [therapist, setTherapist] = useState(null)
  const [date, setDateValue] = useState('')
  const [duration, setDuration] = useState(60)
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [slotLoading, setSlotLoading] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [activePackage, setActivePackage] = useState(null)
  const [message, setMessage] = useState('')
  const [waitlistLoading, setWaitlistLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(() => monthKey(new Date()))
  const [availableDates, setAvailableDates] = useState({})
  const [showWaitlistModal, setShowWaitlistModal] = useState(false)
  const [showDateModal, setShowDateModal] = useState(false)
  const clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const todayKey = localDateKey(new Date())
  const currentMonthKey = monthKey(new Date())
  const calendarWeeks = calendarWeeksForMonth(selectedMonth)
  const selectedMonthDate = new Date(`${selectedMonth}-01T12:00:00`)

  const setDate = (value) => {
    setDateValue(value)
    setShowDateModal(Boolean(value))
  }

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
    if (!therapist) return
    let cancelled = false
    const dates = calendarWeeksForMonth(selectedMonth).flat().filter((day) => monthKey(day) === selectedMonth && localDateKey(day) >= todayKey)
    Promise.all(dates.map(async (day) => {
      const key = localDateKey(day)
      try {
        const { data } = await axiosInstance.get(`/client-booking/therapists/${therapist._id}/availability`, { params: { date: key, duration, timezone: clientTimeZone } })
        return [key, Boolean(data.slots?.length)]
      } catch {
        return [key, false]
      }
    })).then((results) => {
      if (!cancelled) setAvailableDates(Object.fromEntries(results))
    })
    return () => { cancelled = true }
  }, [therapist, duration, selectedMonth, clientTimeZone, todayKey])

  useEffect(() => {
    if (!therapist || !date) return
    let cancelled = false
    const loadSlots = (showLoading) => {
      if (showLoading) setSlotLoading(true)
      axiosInstance.get(`/client-booking/therapists/${therapist._id}/availability`, { params: { date, duration, timezone: clientTimeZone, _: Date.now() } })
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
  }, [therapist, date, duration, clientTimeZone])

  const filteredTherapists = therapists.filter((item) => !specialization.trim() || item.specializations?.some((value) => value.toLowerCase().includes(specialization.trim().toLowerCase())))

  async function verifyPayment(orderData, result) {
    await axiosInstance.post('/client-booking/verify', {
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
        theme: { color: '#10B981' } // Emerald
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

  async function joinWaitlist() {
    if (!therapist || !date) return
    setWaitlistLoading(true)
    setMessage('')
    try {
      await axiosInstance.post('/client-booking/waitlist', { therapist_id: therapist._id, date, duration })
      setShowWaitlistModal(false)
      setShowDateModal(false)
      setMessage('You joined the waitlist. We will notify you if a matching slot opens.')
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to join the waitlist.')
    } finally {
      setWaitlistLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#FAFAF9] text-[#1E293B]">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-12">
        <button onClick={() => navigate(-1)} className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[#64748B] transition-colors hover:text-[#1E293B]">
          <ArrowLeft size={16} /> Back
        </button>
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <Leaf size={20} className="text-emerald-500" />
            <p className="text-sm font-semibold uppercase tracking-[.18em] text-emerald-600">Find your fit</p>
          </div>
          <h1 className="font-display text-4xl font-semibold tracking-[-.04em] text-[#1E293B] sm:text-5xl">Book a session</h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-[#64748B]">
            Choose a therapist, find an available time, and pay for one session securely. Times are shown in {clientTimeZone}.
          </p>
        </header>

        {message && (
          <p className="mb-6 rounded-xl bg-red-100 px-4 py-3 text-sm font-medium text-red-700">
            {message}
          </p>
        )}

        {showDateModal && (
          <DateBookingModal
            date={date}
            duration={duration}
            slots={slots}
            slotLoading={slotLoading}
            selectedSlot={selectedSlot}
            therapist={therapist}
            activePackage={activePackage}
            paymentLoading={paymentLoading}
            waitlistLoading={waitlistLoading}
            onClose={() => setShowDateModal(false)}
            onSelectSlot={setSelectedSlot}
            onBook={payAndBook}
            onPackageBook={bookWithPackage}
            onWaitlist={joinWaitlist}
          />
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          {/* Step 1: Choose therapist */}
          <section className="rounded-[28px] border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[.15em] text-[#64748B]">Step 1</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-[#1E293B]">Choose a therapist</h2>
            <label className="relative mt-6 block">
              <Search size={17} className="absolute left-4 top-3.5 text-[#64748B]" />
              <input
                value={specialization}
                onChange={(event) => setSpecialization(event.target.value)}
                placeholder="Filter by specialization"
                className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-[#FAFAF9] pl-11 pr-4 text-sm text-[#1E293B] outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </label>
            <div className="mt-5 space-y-3">
              {loading && <p className="text-sm text-[#64748B]">Loading therapists...</p>}
              {!loading && !filteredTherapists.length && (
                <p className="rounded-2xl border border-dashed border-[#E2E8F0] p-5 text-sm text-[#64748B]">
                  No therapists match that specialization.
                </p>
              )}
              {filteredTherapists.map((item) => (
                <div key={item._id} className="group relative">
                  <button
                    type="button"
                    onClick={() => { setTherapist(item); setDate(''); setSlots([]) }}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      therapist?._id === item._id
                        ? 'border-emerald-500 bg-emerald-50/60'
                        : 'border-[#E2E8F0] hover:border-emerald-500/50 hover:bg-[#FAFAF9]'
                    }`}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span>
                        <strong className="block font-display text-lg text-[#1E293B]">{item.name}</strong>
                        <span className="mt-1 block text-sm text-[#64748B]">
                          {item.languages?.length ? `Sessions in ${item.languages.join(' · ')}` : 'Therapy sessions available'}
                        </span>
                      </span>
                      {therapist?._id === item._id && <Check className="text-emerald-500" size={20} />}
                    </span>
                    <span className="mt-3 block text-sm font-bold text-emerald-600">INR {item.session_rate || 1500} / session</span>
                  </button>
                  {/* Hover card */}
                  <div className="pointer-events-none absolute left-4 right-4 top-full z-30 mt-3 origin-top scale-95 rounded-[24px] border border-[#E2E8F0] bg-white p-5 opacity-0 shadow-[0_24px_60px_rgba(31,41,36,.16)] transition duration-200 ease-out group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:scale-100 group-focus-within:opacity-100">
                    <div className="flex items-start gap-3 border-b border-[#E2E8F0] pb-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 font-display text-lg font-semibold text-emerald-600">
                        {item.name.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-display text-lg font-semibold text-[#1E293B]">{item.name}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-emerald-600">Therapist profile</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-[#64748B]">{item.bio || 'A supportive space for your wellbeing.'}</p>
                    <div className="mt-4 grid gap-3 text-sm">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Specializations</p>
                        <p className="mt-1 font-medium text-[#1E293B]/75">{item.specializations?.length ? item.specializations.join(' · ') : 'General therapy'}</p>
                      </div>
                      {item.languages?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Languages</p>
                          <p className="mt-1 font-medium text-[#1E293B]/75">{item.languages.join(' · ')}</p>
                        </div>
                      )}
                      <div className="flex items-center justify-between border-t border-[#E2E8F0] pt-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Session rate</span>
                        <strong className="text-emerald-600">INR {item.session_rate || 1500}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Step 2 & 3 combined */}
          <div className="space-y-6">
            {/* Step 2: Find a time */}
            <section className="rounded-[28px] border border-[#E2E8F0] bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[.15em] text-[#64748B]">Step 2</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-[#1E293B]">Find a time</h2>
              {therapist ? (
                <>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {durations.map((item) => (
                      <button
                        type="button"
                        key={item}
                        onClick={() => { setDuration(item); setSelectedSlot(null) }}
                        className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                          duration === item
                            ? 'bg-[#1E293B] text-white'
                            : 'bg-[#FAFAF9] text-[#64748B] hover:text-[#1E293B]'
                        }`}
                      >
                        {item} min
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-[#64748B]">Try a different session duration to find more available time slots.</p>

                  {/* Calendar */}
                  <div className="mt-6 rounded-2xl border border-[#E2E8F0] bg-[#FAFAF9] p-3 sm:p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <button
                        type="button"
                        disabled={selectedMonth === currentMonthKey}
                        onClick={() => {
                          const previous = new Date(`${selectedMonth}-01T12:00:00`)
                          previous.setMonth(previous.getMonth() - 1)
                          setSelectedMonth(monthKey(previous))
                          setDate('')
                          setSlots([])
                          setSelectedSlot(null)
                        }}
                        className="rounded-full p-2 text-[#64748B] transition-colors hover:bg-white hover:text-[#1E293B] disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label="Previous month"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <div className="flex items-center gap-2 font-display text-lg font-semibold text-[#1E293B]">
                        <Calendar size={18} className="text-emerald-500" />
                        {selectedMonthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const next = new Date(`${selectedMonth}-01T12:00:00`)
                          next.setMonth(next.getMonth() + 1)
                          setSelectedMonth(monthKey(next))
                          setDate('')
                          setSlots([])
                          setSelectedSlot(null)
                        }}
                        className="rounded-full p-2 text-[#64748B] transition-colors hover:bg-white hover:text-[#1E293B]"
                        aria-label="Next month"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-[#64748B] sm:gap-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName) => (
                        <span key={dayName}>{dayName}</span>
                      ))}
                    </div>
                    <div className="mt-2 space-y-1 sm:space-y-2">
                      {calendarWeeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="grid grid-cols-7 gap-1 sm:gap-2">
                          {week.map((day) => {
                            const key = localDateKey(day)
                            const isActiveMonth = monthKey(day) === selectedMonth
                            const isPast = key < todayKey
                            const isAvailable = availableDates[key]
                            return (
                              <button
                                type="button"
                                key={key}
                                disabled={!isActiveMonth || isPast}
                                onClick={() => { setDate(key); setSelectedSlot(null) }}
                                className={`relative min-h-14 rounded-xl border p-2 text-left transition sm:min-h-16 ${
                                  !isActiveMonth || isPast
                                    ? 'cursor-default border-transparent bg-transparent text-[#64748B]/20'
                                    : date === key
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                                    : 'border-[#E2E8F0] bg-white text-[#1E293B] hover:border-emerald-500'
                                } ${isAvailable && date !== key ? 'ring-1 ring-emerald-500/30' : ''}`}
                              >
                                <span className="text-sm font-bold">{day.getDate()}</span>
                                {isAvailable && (
                                  <span className="absolute bottom-2 left-2 h-1.5 w-1.5 rounded-full bg-emerald-500" aria-label="Available date" />
                                )}
                              </button>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-[#64748B]">
                      <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Available dates are marked. Select any future date to view times or join the waitlist.
                    </p>
                  </div>

                </>
              ) : (
                <p className="mt-6 rounded-2xl border border-dashed border-[#E2E8F0] p-5 text-sm text-[#64748B]">
                  Select a therapist first to see availability.
                </p>
              )}
            </section>

            {/* Step 3: Confirm booking */}
            <section className="rounded-[28px] border border-emerald-200 bg-emerald-50/60 p-6 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[.15em] text-emerald-600">Step 3</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-[#1E293B]">Confirm booking</h2>
              {therapist && selectedSlot ? (
                <div className="mt-5 space-y-2 text-sm text-[#64748B]">
                  <p><strong className="text-[#1E293B]">Therapist:</strong> {therapist.name}</p>
                  <p><strong className="text-[#1E293B]">When:</strong> {new Date(selectedSlot.start).toLocaleString()}</p>
                  <p><strong className="text-[#1E293B]">Duration:</strong> {duration} minutes</p>
                  {activePackage?.therapist_id === therapist._id && activePackage.sessions_remaining > 0 ? (
                    <button
                      type="button"
                      disabled={paymentLoading}
                      onClick={bookWithPackage}
                      className="mt-5 w-full rounded-full bg-emerald-500 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
                    >
                      Use package session ({activePackage.sessions_remaining} left)
                    </button>
                  ) : (
                    <>
                      <p className="pt-2 font-display text-2xl font-semibold text-[#1E293B]">INR {therapist.session_rate || 1500}</p>
                      <button
                        type="button"
                        disabled={paymentLoading}
                        onClick={payAndBook}
                        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1E293B] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
                      >
                        <CreditCard size={17} />
                        {paymentLoading ? 'Processing...' : 'Pay and book session'}
                      </button>
                    </>
                  )}
                  <p className="mt-3 text-xs leading-5 text-[#64748B]">
                    A package booking uses one remaining session. Otherwise, the session is created only after payment verification succeeds.
                  </p>
                </div>
              ) : (
                <p className="mt-5 text-sm text-[#64748B]">Choose a therapist and time to continue.</p>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Waitlist Modal */}
      {showWaitlistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E293B]/40 p-5" role="dialog" aria-modal="true" aria-labelledby="waitlist-title">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[.15em] text-emerald-600">No slot available</p>
                <h2 id="waitlist-title" className="mt-2 font-display text-2xl font-semibold text-[#1E293B]">Join the waitlist?</h2>
              </div>
              <button type="button" onClick={() => setShowWaitlistModal(false)} aria-label="Close waitlist dialog" className="rounded-full px-3 py-1 text-2xl text-[#64748B] hover:bg-[#FAFAF9] hover:text-[#1E293B]">
                &times;
              </button>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#64748B]">
              There are no {duration}-minute sessions available for{' '}
              {new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}.
              Try another duration or join the waitlist and we will notify you if a matching slot opens.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowWaitlistModal(false)}
                className="rounded-full border border-[#E2E8F0] px-5 py-3 text-sm font-bold text-[#64748B] transition-colors hover:bg-[#FAFAF9] hover:text-[#1E293B]"
              >
                Try another duration
              </button>
              <button
                type="button"
                disabled={waitlistLoading}
                onClick={joinWaitlist}
                className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
              >
                {waitlistLoading ? 'Joining...' : 'Join waitlist'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}