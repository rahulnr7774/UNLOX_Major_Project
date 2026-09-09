import PageBackButton from '../../components/common/PageBackButton'
import { useEffect, useState } from 'react'
import {
  Calendar,
  Clock,
  Settings,
  Plus,
  AlertCircle,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CalendarCheck,
} from 'lucide-react'
import axiosInstance from '../../api/axiosInstance'

function Schedule() {
  const [weeklySchedule, setWeeklySchedule] = useState([
    { day: 0, name: 'Sunday', enabled: false, slots: [] },
    { day: 1, name: 'Monday', enabled: false, slots: [] },
    { day: 2, name: 'Tuesday', enabled: false, slots: [] },
    { day: 3, name: 'Wednesday', enabled: false, slots: [] },
    { day: 4, name: 'Thursday', enabled: false, slots: [] },
    { day: 5, name: 'Friday', enabled: false, slots: [] },
    { day: 6, name: 'Saturday', enabled: false, slots: [] },
  ])

  const [bufferTime, setBufferTime] = useState(0)
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'
  )
  const [sessionDurations, setSessionDurations] = useState([30, 45, 60, 90])
  const [overrides, setOverrides] = useState([])
  const [blockedSlots, setBlockedSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [savedSnapshot, setSavedSnapshot] = useState('')
  const [bookedSessions, setBookedSessions] = useState([])
  const [hoveredClientSession, setHoveredClientSession] =
    useState(null)

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  })

  const [selectedDateKey, setSelectedDateKey] = useState('')
  const [hoveredDate, setHoveredDate] = useState(null)

  const currentMonth = new Date()
  const currentMonthValue = `${currentMonth.getFullYear()}-${String(
    currentMonth.getMonth() + 1
  ).padStart(2, '0')}`

  const activeMonth = selectedMonth || currentMonthValue

  const [activeYear, activeMonthNumber] = activeMonth.split('-').map(Number)

  const calendarWeeks = (() => {
    const firstDay = new Date(activeYear, activeMonthNumber - 1, 1)
    const lastDay = new Date(activeYear, activeMonthNumber, 0)

    const start = new Date(firstDay)
    start.setDate(1 - firstDay.getDay())

    const weeks = []

    while (start <= lastDay || weeks.length < 5) {
      weeks.push(
        Array.from({ length: 7 }, (_, index) => {
          const date = new Date(start)
          date.setDate(start.getDate() + index)
          return date
        })
      )

      start.setDate(start.getDate() + 7)

      if (weeks.length >= 6) break
    }

    return weeks
  })()

  const availabilityPayload = {
    weekly_schedule: weeklySchedule,
    buffer_time: bufferTime,
    session_durations: sessionDurations,
    timezone,
    overrides,
    blocked_slots: blockedSlots,
  }

  const isSaved =
    savedSnapshot === JSON.stringify(availabilityPayload)

  const toDateInput = (value) =>
    value ? new Date(value).toISOString().slice(0, 10) : ''

  const toDateTimeInput = (value) =>
    value ? new Date(value).toISOString().slice(0, 16) : ''

  const dateKey = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  const selectedOverride = overrides.find(
    (override) => override.date === selectedDateKey
  )

  const selectedDate = selectedDateKey
    ? new Date(`${selectedDateKey}T12:00:00`)
    : null

  const selectedWeeklyDay =
    selectedDate &&
    weeklySchedule.find(
      (day) => day.day === selectedDate.getDay()
    )

  const selectedDateSlots = selectedOverride
    ? selectedOverride.available
      ? selectedOverride.slots
      : []
    : selectedWeeklyDay?.enabled
      ? selectedWeeklyDay.slots
      : []

  const selectedDateIsAvailable = selectedOverride
    ? selectedOverride.available
    : Boolean(selectedWeeklyDay?.enabled)

  const getSlotsForDate = (date) => {
    const override = overrides.find(
      (item) => item.date === dateKey(date)
    )

    if (override) {
      return override.available ? override.slots : []
    }

    return (
      weeklySchedule.find(
        (day) => day.day === date.getDay() && day.enabled
      )?.slots || []
    )
  }

  const getBookedSessionsForDate = (date) =>
    bookedSessions.filter(
      (session) =>
        dateKey(new Date(session.starts_at)) === dateKey(date)
    )

  const getDayOutlineClass = (
    slots,
    booked,
    isActiveMonth,
    isSelected
  ) => {
    if (!isActiveMonth) {
      return 'border-transparent bg-transparent text-slate-300'
    }

    if (isSelected) {
      return 'border-violet-500 bg-violet-50 text-violet-900 shadow-[0_0_0_3px_rgba(124,58,237,0.08)]'
    }

    if (booked.length >= 4) {
      return 'border-violet-700 bg-violet-50'
    }

    if (booked.length === 3) {
      return 'border-violet-600 bg-violet-50'
    }

    if (booked.length === 2) {
      return 'border-violet-500 bg-violet-50'
    }

    if (booked.length === 1) {
      return 'border-violet-400 bg-violet-50'
    }

    if (slots.length) {
      return 'border-emerald-400 bg-emerald-50/50'
    }

    return 'border-slate-200 bg-white'
  }

  const formatTime = (value) =>
    new Date(value).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    })

  const showDateDetails = (event, date) => {
    const bounds = event.currentTarget.getBoundingClientRect()

    setHoveredDate({
      date,
      slots: getSlotsForDate(date),
      booked: getBookedSessionsForDate(date),
      position: {
        top: bounds.bottom + 8,
        left: Math.min(bounds.left, window.innerWidth - 300),
      },
    })
  }

  const resetMonthAvailability = () => {
    const daysInMonth = new Date(
      activeYear,
      activeMonthNumber,
      0
    ).getDate()

    const monthDates = Array.from(
      { length: daysInMonth },
      (_, index) =>
        `${activeYear}-${String(activeMonthNumber).padStart(
          2,
          '0'
        )}-${String(index + 1).padStart(2, '0')}`
    )

    setOverrides((previous) => [
      ...previous.filter(
        (override) => !monthDates.includes(override.date)
      ),
      ...monthDates.map((date) => ({
        date,
        available: false,
        slots: [],
      })),
    ])

    setSelectedDateKey('')

    setMessage(
      `${new Intl.DateTimeFormat(undefined, {
        month: 'long',
        year: 'numeric',
      }).format(
        new Date(activeYear, activeMonthNumber - 1, 1)
      )} availability reset. Save Availability to apply it.`
    )
  }

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setLoading(true)

        const response = await axiosInstance.get(
          '/scheduling/availability'
        )

        const sessionsResponse =
          await axiosInstance.get('/scheduling/sessions')

        setBookedSessions(
          sessionsResponse.data.sessions || []
        )

        const availability = response.data.availability

        if (availability) {
          const loadedOverrides = (
            availability.overrides || []
          ).map((override) => ({
            ...override,
            date: toDateInput(override.date),
          }))

          const loadedBlockedSlots = (
            availability.blocked_slots || []
          ).map((slot) => ({
            ...slot,
            start: toDateTimeInput(slot.start),
            end: toDateTimeInput(slot.end),
          }))

          if (availability.weekly_schedule) {
            setWeeklySchedule(
              availability.weekly_schedule
            )
          }

          if (availability.buffer_time !== undefined) {
            setBufferTime(availability.buffer_time)
          }

          if (availability.session_durations) {
            setSessionDurations(
              availability.session_durations
            )
          }

          if (availability.timezone) {
            setTimezone(availability.timezone)
          }

          if (availability.overrides) {
            setOverrides(loadedOverrides)
          }

          if (availability.blocked_slots) {
            setBlockedSlots(loadedBlockedSlots)
          }

          setSavedSnapshot(
            JSON.stringify({
              weekly_schedule:
                availability.weekly_schedule || [],
              buffer_time:
                availability.buffer_time ?? 0,
              session_durations:
                availability.session_durations || [],
              timezone:
                availability.timezone || 'Asia/Kolkata',
              overrides: loadedOverrides,
              blocked_slots: loadedBlockedSlots,
            })
          )
        }
      } catch (error) {
        console.error(
          'Failed to load availability',
          error
        )
      } finally {
        setLoading(false)
      }
    }

    fetchAvailability()
  }, [])

  const selectDate = (date) => {
    setSelectedDateKey(dateKey(date))
  }

  const updateSelectedDateOverride = (
    field,
    value
  ) => {
    setOverrides((previous) => {
      const index = previous.findIndex(
        (override) =>
          override.date === selectedDateKey
      )

      if (index === -1) {
        return [
          ...previous,
          {
            date: selectedDateKey,
            available:
              field === 'available'
                ? value
                : selectedDateIsAvailable,
            slots:
              field === 'slots'
                ? value
                : selectedDateSlots,
          },
        ]
      }

      return previous.map(
        (override, overrideIndex) =>
          overrideIndex === index
            ? {
                ...override,
                [field]: value,
              }
            : override
      )
    })
  }

  const addSelectedDateSlot = () => {
    if (
      !selectedDateKey ||
      selectedDateSlots.length >= 6
    ) {
      return
    }

    updateSelectedDateOverride('slots', [
      ...selectedDateSlots,
      {
        start: '09:00',
        end: '10:00',
      },
    ])
  }

  const updateSelectedDateSlot = (
    slotIndex,
    field,
    value
  ) => {
    updateSelectedDateOverride(
      'slots',
      selectedDateSlots.map((slot, index) =>
        index === slotIndex
          ? {
              ...slot,
              [field]: value,
            }
          : slot
      )
    )
  }

  const removeSelectedDateSlot = (slotIndex) => {
    updateSelectedDateOverride(
      'slots',
      selectedDateSlots.filter(
        (_, index) => index !== slotIndex
      )
    )
  }

  const toggleDuration = (duration) => {
    setSessionDurations((previous) =>
      previous.includes(duration)
        ? previous.filter(
            (item) => item !== duration
          )
        : [...previous, duration].sort(
            (a, b) => a - b
          )
    )
  }

  const saveAvailability = async () => {
    try {
      setLoading(true)
      setMessage('')

      const payload = {
        weekly_schedule: weeklySchedule,
        buffer_time: bufferTime,
        session_durations: sessionDurations,
        timezone,
        overrides,
        blocked_slots: blockedSlots,
      }

      const response = await axiosInstance.put(
        '/scheduling/availability',
        payload
      )

      setSavedSnapshot(JSON.stringify(payload))

      setMessage(
        response.data.message ||
          'Availability saved successfully.'
      )
    } catch (error) {
      console.error(error)
      setMessage('Failed to save availability.')
    } finally {
      setLoading(false)
    }
  }

  const addBlockedSlot = () => {
    setBlockedSlots((previous) => [
      ...previous,
      {
        start: '',
        end: '',
        reason: '',
      },
    ])
  }

  const removeBlockedSlot = (index) => {
    setBlockedSlots((previous) =>
      previous.filter(
        (_, itemIndex) => itemIndex !== index
      )
    )
  }

  const changeMonth = (direction) => {
    const date = new Date(
      activeYear,
      activeMonthNumber - 1 + direction,
      1
    )

    setSelectedMonth(
      `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, '0')}`
    )
  }

  const enabledDays = weeklySchedule.filter(
    (day) => day.enabled
  ).length

  const totalWeeklySlots = weeklySchedule.reduce(
    (total, day) => total + day.slots.length,
    0
  )

  if (loading && weeklySchedule.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#F8FAFC] text-sm text-[#64748B]">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-200 border-t-violet-500" />
          Loading schedule...
        </div>
      </div>
    )
  }

  return (
    <section className="mx-auto max-w-[1440px] space-y-8 px-5 py-8 sm:px-8 lg:px-12">
      <div className="animate-[fadeIn_.45s_ease-out]">
        <PageBackButton
          to="/dashboard"
          label="Back to dashboard"
        />
      </div>

      {/* Header */}
      <header className="flex animate-[fadeInUp_.5s_ease-out] flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[.16em] text-violet-600">
            <Sparkles size={13} />
            Practice settings
          </div>

          <h1 className="font-display text-4xl font-semibold tracking-[-.04em] text-[#1E293B] sm:text-5xl">
            Your schedule
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-[#64748B] sm:text-base">
            Shape your availability, protect your focus time,
            and make booking effortless for your clients.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CalendarCheck size={18} />
          </div>

          <div>
            <p className="text-xs font-semibold text-[#64748B]">
              Weekly availability
            </p>
            <p className="text-sm font-bold text-[#1E293B]">
              {enabledDays} active days · {totalWeeklySlots}{' '}
              slots
            </p>
          </div>
        </div>
      </header>

      {message && (
        <div className="animate-[fadeInDown_.35s_ease-out] rounded-2xl border border-violet-100 bg-violet-50 px-5 py-4 text-sm font-semibold text-violet-700 shadow-sm">
          {message}
        </div>
      )}

      {/* Calendar */}
      <section className="animate-[fadeInUp_.55s_ease-out] overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(30,41,59,0.06)]">
        <div className="border-b border-slate-100 p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                  <Calendar size={20} />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[.16em] text-violet-600">
                    Availability
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-semibold text-[#1E293B]">
                    Calendar
                  </h2>
                </div>
              </div>

              <p className="mt-3 text-sm text-[#64748B]">
                Select a date to create a custom availability
                override.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#64748B] transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600"
              >
                <ChevronLeft size={17} />
              </button>

              <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 text-sm font-bold text-[#1E293B]">
                {new Intl.DateTimeFormat(undefined, {
                  month: 'long',
                  year: 'numeric',
                }).format(
                  new Date(
                    activeYear,
                    activeMonthNumber - 1,
                    1
                  )
                )}
              </div>

              <button
                type="button"
                onClick={() => changeMonth(1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#64748B] transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600"
              >
                <ChevronRight size={17} />
              </button>

              <input
                type="month"
                value={activeMonth}
                onChange={(event) =>
                  setSelectedMonth(
                    event.target.value ||
                      currentMonthValue
                  )
                }
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-[#1E293B] outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />

              <button
                type="button"
                onClick={resetMonthAvailability}
                className="h-10 rounded-xl border border-red-200 px-4 text-xs font-bold text-red-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-50"
              >
                Reset month
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-[#F8FAFC] p-3 sm:p-4">
            <div className="grid min-w-[620px] grid-cols-7 gap-2 text-center text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              {[
                'Sun',
                'Mon',
                'Tue',
                'Wed',
                'Thu',
                'Fri',
                'Sat',
              ].map((dayName) => (
                <span key={dayName} className="py-2">
                  {dayName}
                </span>
              ))}
            </div>

            <div className="mt-1 min-w-[620px] space-y-2">
              {calendarWeeks.map(
                (week, weekIndex) => (
                  <div
                    key={weekIndex}
                    className="grid grid-cols-7 gap-2"
                  >
                    {week.map((date) => {
                      const isActiveMonth =
                        date.getMonth() ===
                        activeMonthNumber - 1

                      const slots =
                        getSlotsForDate(date)

                      const booked =
                        getBookedSessionsForDate(
                          date
                        )

                      const isSelected =
                        selectedDateKey ===
                        dateKey(date)

                      const isToday =
                        dateKey(date) ===
                        dateKey(new Date())

                      return (
                        <button
                          key={date.toISOString()}
                          type="button"
                          onClick={() =>
                            selectDate(date)
                          }
                          onMouseEnter={(event) =>
                            showDateDetails(
                              event,
                              date
                            )
                          }
                          onMouseLeave={() =>
                            setHoveredDate(null)
                          }
                          onFocus={(event) =>
                            showDateDetails(
                              event,
                              date
                            )
                          }
                          onBlur={() =>
                            setHoveredDate(null)
                          }
                          className={`group relative min-h-[78px] rounded-2xl border-2 p-3 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-violet-400 hover:bg-violet-50 hover:shadow-sm ${getDayOutlineClass(
                            slots,
                            booked,
                            isActiveMonth,
                            isSelected
                          )}`}
                        >
                          <div className="flex items-start justify-between">
                            <p className="text-sm font-bold">
                              {date.getDate()}
                            </p>

                            {isToday &&
                              isActiveMonth && (
                                <span className="h-2 w-2 animate-pulse rounded-full bg-violet-500" />
                              )}
                          </div>

                          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide opacity-60">
                            {new Intl.DateTimeFormat(
                              undefined,
                              {
                                weekday: 'short',
                              }
                            ).format(date)}
                          </p>

                          {isActiveMonth &&
                            (slots.length > 0 ||
                              booked.length > 0) && (
                              <div className="mt-3 flex items-center gap-1.5">
                                {slots.length > 0 && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                )}

                                {booked.length > 0 && (
                                  <span className="text-[9px] font-bold text-violet-600">
                                    {booked.length}{' '}
                                    booked
                                  </span>
                                )}
                              </div>
                            )}
                        </button>
                      )
                    })}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center gap-5 text-xs font-semibold text-[#64748B]">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Available
            </span>

            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
              Booked
            </span>

            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              Unavailable
            </span>
          </div>
        </div>
      </section>

      {/* Hover details */}
      {hoveredDate && (
        <div
          className="pointer-events-none fixed z-[60] w-72 animate-[fadeIn_.2s_ease-out] rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-[0_20px_50px_rgba(15,23,42,0.15)]"
          style={{
            top: hoveredDate.position.top,
            left: hoveredDate.position.left,
          }}
        >
          <p className="text-sm font-bold text-[#1E293B]">
            {hoveredDate.date.toLocaleDateString(
              undefined,
              {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              }
            )}
          </p>

          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Available slots
            </p>

            {hoveredDate.slots.length ? (
              <div className="mt-2 space-y-1">
                {hoveredDate.slots.map((slot) => (
                  <p
                    key={`${slot.start}-${slot.end}`}
                    className="text-sm font-semibold text-emerald-700"
                  >
                    {slot.start} - {slot.end}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                No availability
              </p>
            )}
          </div>

          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Booked sessions (
              {hoveredDate.booked.length})
            </p>

            {hoveredDate.booked.length ? (
              <div className="mt-2 space-y-3">
                {hoveredDate.booked.map(
                  (session) => (
                    <div
                      key={session._id}
                      className="text-sm"
                    >
                      <p className="font-semibold text-[#1E293B]">
                        {session.client_id?.name ||
                          'Client'}
                      </p>

                      <p className="text-slate-600">
                        {formatTime(
                          session.starts_at
                        )}{' '}
                        -{' '}
                        {formatTime(
                          session.ends_at
                        )}{' '}
                        ·{' '}
                        <span className="capitalize">
                          {session.status}
                        </span>
                      </p>

                      <p className="text-xs text-slate-500">
                        {session.mode ===
                        'in_person'
                          ? 'In person'
                          : 'Online'}{' '}
                        ·{' '}
                        {session.session_code ||
                          'Code pending'}
                      </p>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                No booked sessions
              </p>
            )}
          </div>
        </div>
      )}

      {/* Date Override */}
      {selectedDate && (
        <div
          className="fixed inset-0 z-50 flex animate-[fadeIn_.2s_ease-out] items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="date-override-title"
        >
          <div className="max-h-[90vh] w-full max-w-xl animate-[scaleIn_.25s_ease-out] overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-bold uppercase tracking-[.15em] text-violet-600">
                  <Calendar size={12} />
                  Calendar date
                </div>

                <h2
                  id="date-override-title"
                  className="mt-3 font-display text-2xl font-semibold text-[#1E293B]"
                >
                  {selectedDate.toLocaleDateString(
                    undefined,
                    {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    }
                  )}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedDateKey('')
                }
                aria-label="Close date editor"
                className="rounded-full p-2 text-slate-500 transition-all hover:rotate-90 hover:bg-slate-100 hover:text-[#1E293B]"
              >
                <X size={20} />
              </button>
            </div>

            <label className="mt-7 flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4 text-sm font-semibold text-[#1E293B] transition-colors hover:border-violet-200 hover:bg-violet-50/50">
              <input
                type="checkbox"
                checked={selectedDateIsAvailable}
                onChange={(event) =>
                  updateSelectedDateOverride(
                    'available',
                    event.target.checked
                  )
                }
                className="h-4 w-4 rounded border-slate-300 text-violet-500 focus:ring-violet-500"
              />

              <span className="flex-1">
                Available on this date
                <span className="mt-0.5 block text-xs font-normal text-[#64748B]">
                  Allow clients to book during the
                  selected hours.
                </span>
              </span>

              {selectedDateIsAvailable && (
                <Check
                  size={18}
                  className="text-emerald-500"
                />
              )}
            </label>

            {selectedDateIsAvailable && (
              <div className="mt-5 space-y-3">
                {selectedDateSlots.map(
                  (slot, slotIndex) => (
                    <div
                      key={slotIndex}
                      className="animate-[fadeInUp_.25s_ease-out] rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4"
                    >
                      <div className="flex flex-wrap items-end gap-3">
                        <label className="flex flex-1 flex-col gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                          Start
                          <input
                            type="time"
                            value={slot.start}
                            onChange={(event) =>
                              updateSelectedDateSlot(
                                slotIndex,
                                'start',
                                event.target.value
                              )
                            }
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-[#1E293B] outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                          />
                        </label>

                        <label className="flex flex-1 flex-col gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                          End
                          <input
                            type="time"
                            value={slot.end}
                            onChange={(event) =>
                              updateSelectedDateSlot(
                                slotIndex,
                                'end',
                                event.target.value
                              )
                            }
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-[#1E293B] outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() =>
                            removeSelectedDateSlot(
                              slotIndex
                            )
                          }
                          className="rounded-xl px-3 py-2.5 text-xs font-bold text-red-500 transition-colors hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )
                )}

                <button
                  type="button"
                  onClick={addSelectedDateSlot}
                  disabled={
                    selectedDateSlots.length >= 6
                  }
                  className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-violet-600 transition-all hover:translate-x-1 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={16} />
                  Add Time Slot (
                  {selectedDateSlots.length}/6)
                </button>
              </div>
            )}

            <div className="mt-7 flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() =>
                  setSelectedDateKey('')
                }
                className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 transition-all hover:-translate-y-0.5 hover:bg-slate-50"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() =>
                  setSelectedDateKey('')
                }
                className="rounded-full bg-violet-500 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-violet-600 hover:shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configuration */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Durations */}
        <section className="animate-[fadeInUp_.65s_ease-out] rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <Clock size={20} />
            </div>

            <div>
              <h2 className="font-display text-2xl font-semibold text-[#1E293B]">
                Session durations
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#64748B]">
                Select the durations clients can book.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {[30, 45, 60, 90].map(
              (duration) => {
                const active =
                  sessionDurations.includes(
                    duration
                  )

                return (
                  <button
                    key={duration}
                    type="button"
                    onClick={() =>
                      toggleDuration(duration)
                    }
                    className={`group flex items-center justify-between rounded-2xl border p-4 text-left transition-all duration-200 ${
                      active
                        ? 'border-violet-300 bg-violet-50 text-violet-700 shadow-sm'
                        : 'border-slate-200 bg-white text-[#1E293B] hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50/50'
                    }`}
                  >
                    <span className="text-sm font-bold">
                      {duration} min
                    </span>

                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full transition-all ${
                        active
                          ? 'bg-violet-500 text-white'
                          : 'border border-slate-200 bg-white text-transparent'
                      }`}
                    >
                      <Check size={14} />
                    </span>
                  </button>
                )
              }
            )}
          </div>
        </section>

        {/* Buffer */}
        <section className="animate-[fadeInUp_.7s_ease-out] rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <Settings size={20} />
            </div>

            <div>
              <h2 className="font-display text-2xl font-semibold text-[#1E293B]">
                Buffer time
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#64748B]">
                Add breathing room between sessions.
              </p>
            </div>
          </div>

          <select
            value={bufferTime}
            onChange={(e) =>
              setBufferTime(Number(e.target.value))
            }
            className="mt-7 w-full rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 py-3.5 text-sm font-semibold text-[#1E293B] outline-none transition-all focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100"
          >
            <option value={0}>No buffer</option>
            <option value={5}>5 minutes</option>
            <option value={10}>10 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
          </select>
        </section>
      </div>

      {/* Timezone */}
      <section className="animate-[fadeInUp_.75s_ease-out] rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#1E293B]">
              Practice timezone
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B]">
              Weekly hours use this timezone. Clients
              see converted times in their own timezone.
            </p>
          </div>

          <div className="rounded-2xl bg-violet-50 px-4 py-3 text-xs font-bold text-violet-700">
            {timezone || 'Not set'}
          </div>
        </div>

        <input
          value={timezone}
          onChange={(e) =>
            setTimezone(e.target.value)
          }
          placeholder="Asia/Kolkata"
          className="mt-6 h-12 w-full rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 text-sm font-semibold text-[#1E293B] outline-none transition-all focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100"
        />
      </section>

      {/* Blocked Slots */}
      <section className="animate-[fadeInUp_.8s_ease-out] rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <AlertCircle size={20} />
            </div>

            <div>
              <h2 className="font-display text-2xl font-semibold text-[#1E293B]">
                Blocked slots
              </h2>

              <p className="mt-1 text-sm leading-6 text-[#64748B]">
                Reserve specific times when clients
                shouldn't be able to book.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={addBlockedSlot}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-bold text-violet-600 transition-all hover:-translate-y-0.5 hover:bg-violet-100"
          >
            <Plus size={16} />
            Block time
          </button>
        </div>

        {blockedSlots.length > 0 ? (
          <div className="mt-6 space-y-3">
            {blockedSlots.map(
              (slot, index) => (
                <div
                  key={index}
                  className="animate-[fadeInUp_.25s_ease-out] rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4 transition-all hover:border-violet-200 hover:bg-violet-50/30"
                >
                  <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                    <input
                      type="datetime-local"
                      value={slot.start}
                      onChange={(e) => {
                        const newSlots = [
                          ...blockedSlots,
                        ]
                        newSlots[index].start =
                          e.target.value
                        setBlockedSlots(newSlots)
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#1E293B] outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    />

                    <input
                      type="datetime-local"
                      value={slot.end}
                      onChange={(e) => {
                        const newSlots = [
                          ...blockedSlots,
                        ]
                        newSlots[index].end =
                          e.target.value
                        setBlockedSlots(newSlots)
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#1E293B] outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    />

                    <input
                      type="text"
                      placeholder="Reason"
                      value={slot.reason}
                      onChange={(e) => {
                        const newSlots = [
                          ...blockedSlots,
                        ]
                        newSlots[index].reason =
                          e.target.value
                        setBlockedSlots(newSlots)
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#1E293B] outline-none transition-all placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        removeBlockedSlot(index)
                      }
                      className="flex items-center justify-center rounded-xl px-4 py-2.5 text-xs font-bold text-red-500 transition-colors hover:bg-red-50"
                    >
                      <X size={16} />
                      <span className="ml-1 sm:hidden">
                        Remove
                      </span>
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-[#F8FAFC] px-5 py-8 text-center">
            <AlertCircle
              size={24}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm font-semibold text-[#64748B]">
              No blocked times
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Add one whenever you need to protect
              time on your calendar.
            </p>
          </div>
        )}
      </section>

      {/* Booked sessions */}
      <section className="animate-[fadeInUp_.85s_ease-out] rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-violet-600">
              Calendar activity
            </p>

            <h2 className="mt-2 font-display text-2xl font-semibold text-[#1E293B]">
              Booked sessions
            </h2>

            <p className="mt-2 text-sm text-[#64748B]">
              Session codes are assigned by the system and
              cannot be changed.
            </p>
          </div>

          <div className="hidden h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 sm:flex">
            <CalendarCheck size={20} />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {bookedSessions.map(
            (session) => (
              <div
                key={session._id}
                className="group flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50/40 hover:shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-violet-500 shadow-sm transition-transform duration-200 group-hover:scale-105">
                    <Clock size={17} />
                  </div>

                  <div
                    className="relative"
                    onMouseEnter={() =>
                      setHoveredClientSession(session._id)
                    }
                    onMouseLeave={() =>
                      setHoveredClientSession(null)
                    }
                    onFocus={() =>
                      setHoveredClientSession(session._id)
                    }
                    onBlur={() =>
                      setHoveredClientSession(null)
                    }
                  >
                    <p className="font-semibold text-[#1E293B]">
                      {session.client_id?.name ||
                        'Client'}
                    </p>

                    <p className="mt-1 text-sm text-[#64748B]">
                      {new Date(
                        session.starts_at
                      ).toLocaleString()}{' '}
                      ·{' '}
                      <span className="capitalize">
                        {session.status}
                      </span>
                    </p>

                    {hoveredClientSession === session._id && (
                      <div className="absolute left-0 top-full z-20 mt-3 w-64 animate-[scaleIn_.18s_ease-out] rounded-2xl border border-violet-100 bg-white p-4 text-left shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
                        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-violet-600">
                          Client details
                        </p>

                        <p className="mt-2 text-sm font-bold text-[#1E293B]">
                          {session.client_id?.name ||
                            'Client'}
                        </p>

                        <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                          <p>
                            <span className="font-semibold text-slate-800">
                              Email:
                            </span>{' '}
                            {session.client_id?.email ||
                              'Not provided'}
                          </p>

                          <p>
                            <span className="font-semibold text-slate-800">
                              Phone:
                            </span>{' '}
                            {session.client_id?.phone ||
                              'Not provided'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-full bg-violet-100 px-4 py-1.5 text-xs font-bold text-violet-700">
                  {session.session_code ||
                    'Code pending'}
                </div>
              </div>
            )
          )}

          {!bookedSessions.length && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-[#F8FAFC] p-8 text-center">
              <Calendar
                size={24}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-sm font-semibold text-[#64748B]">
                No booked sessions yet.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Save */}
      <section className="sticky bottom-4 z-30 animate-[fadeInUp_.9s_ease-out]">
        <div className="flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-white/95 p-4 shadow-[0_20px_50px_rgba(15,23,42,0.12)] backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <p className="text-sm font-bold text-[#1E293B]">
              {isSaved
                ? 'Your availability is up to date'
                : 'You have unsaved changes'}
            </p>

            <p className="mt-1 text-xs text-[#64748B]">
              Save your changes to update client
              booking availability.
            </p>
          </div>

          <button
            type="button"
            onClick={saveAvailability}
            disabled={loading || isSaved}
            className={`inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 ${
              isSaved
                ? 'cursor-not-allowed bg-emerald-500'
                : 'bg-violet-500 hover:-translate-y-0.5 hover:bg-violet-600 hover:shadow-md active:translate-y-0'
            } disabled:cursor-not-allowed disabled:opacity-70`}
          >
            {isSaved ? (
              <>
                <Check size={16} />
                Saved
              </>
            ) : (
              <>
                <CalendarCheck size={16} />
                {loading
                  ? 'Saving...'
                  : 'Save availability'}
              </>
            )}
          </button>
        </div>
      </section>

      {/* Small animation helpers */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(.97);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </section>
  )
}

export default Schedule
