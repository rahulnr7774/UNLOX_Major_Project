import { useEffect, useState } from "react";
import { Calendar, Clock, Settings, Plus, AlertCircle, X } from "lucide-react";
import axiosInstance from "../../api/axiosInstance";

function Schedule() {
  // -----------------------------
  // STATES (unchanged)
  // -----------------------------
  const [weeklySchedule, setWeeklySchedule] = useState([
    { day: 0, name: "Sunday", enabled: false, slots: [] },
    { day: 1, name: "Monday", enabled: false, slots: [] },
    { day: 2, name: "Tuesday", enabled: false, slots: [] },
    { day: 3, name: "Wednesday", enabled: false, slots: [] },
    { day: 4, name: "Thursday", enabled: false, slots: [] },
    { day: 5, name: "Friday", enabled: false, slots: [] },
    { day: 6, name: "Saturday", enabled: false, slots: [] }
  ]);
  const [bufferTime, setBufferTime] = useState(0);
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata");
  const [sessionDurations, setSessionDurations] = useState([30, 45, 60, 90]);
  const [overrides, setOverrides] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [bookedSessions, setBookedSessions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selectedDateKey, setSelectedDateKey] = useState("");
  const [hoveredDate, setHoveredDate] = useState(null);

  const currentMonth = new Date();
  const currentMonthValue = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;
  const activeMonth = selectedMonth || currentMonthValue;

  const calendarWeeks = (() => {
    const [year, month] = activeMonth.split("-").map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const start = new Date(firstDay);
    start.setDate(1 - firstDay.getDay());
    const weeks = [];
    while (start <= lastDay || weeks.length < 5) {
      weeks.push(Array.from({ length: 7 }, (_, index) => {
        const date = new Date(start);
        date.setDate(start.getDate() + index);
        return date;
      }));
      start.setDate(start.getDate() + 7);
      if (weeks.length >= 6) break;
    }
    return weeks;
  })();

  const availabilityPayload = {
    weekly_schedule: weeklySchedule,
    buffer_time: bufferTime,
    session_durations: sessionDurations,
    timezone,
    overrides,
    blocked_slots: blockedSlots
  };
  const isSaved = savedSnapshot === JSON.stringify(availabilityPayload);

  const toDateInput = (value) => value ? new Date(value).toISOString().slice(0, 10) : "";
  const toDateTimeInput = (value) => value ? new Date(value).toISOString().slice(0, 16) : "";

  const dateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const selectedOverride = overrides.find((override) => override.date === selectedDateKey);
  const selectedDate = selectedDateKey ? new Date(`${selectedDateKey}T12:00:00`) : null;
  const selectedWeeklyDay = selectedDate && weeklySchedule.find((day) => day.day === selectedDate.getDay());
  const selectedDateSlots = selectedOverride
    ? (selectedOverride.available ? selectedOverride.slots : [])
    : (selectedWeeklyDay?.enabled ? selectedWeeklyDay.slots : []);
  const selectedDateIsAvailable = selectedOverride ? selectedOverride.available : Boolean(selectedWeeklyDay?.enabled);

  const getSlotsForDate = (date) => {
    const override = overrides.find((item) => item.date === dateKey(date));
    if (override) return override.available ? override.slots : [];
    return weeklySchedule.find((day) => day.day === date.getDay() && day.enabled)?.slots || [];
  };

  const getBookedSessionsForDate = (date) => bookedSessions.filter((session) => dateKey(new Date(session.starts_at)) === dateKey(date));

  const getDayOutlineClass = (slots, booked, isActiveMonth) => {
    if (!isActiveMonth) return "border-transparent bg-transparent text-slate-300";
    if (booked.length >= 4) return "border-violet-700 bg-violet-50";
    if (booked.length === 3) return "border-violet-600 bg-violet-50";
    if (booked.length === 2) return "border-violet-500 bg-violet-50";
    if (booked.length === 1) return "border-violet-400 bg-violet-50";
    if (slots.length) return "border-emerald-400 bg-emerald-50/40";
    return "border-slate-200 bg-white";
  };

  const formatTime = (value) => new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  const showDateDetails = (event, date) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setHoveredDate({
      date,
      slots: getSlotsForDate(date),
      booked: getBookedSessionsForDate(date),
      position: { top: bounds.bottom + 8, left: Math.min(bounds.left, window.innerWidth - 300) }
    });
  };

  const resetMonthAvailability = () => {
    const [year, month] = activeMonth.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const monthDates = Array.from({ length: daysInMonth }, (_, index) => {
      return `${year}-${String(month).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`;
    });

    setOverrides((previous) => [
      ...previous.filter((override) => !monthDates.includes(override.date)),
      ...monthDates.map((date) => ({ date, available: false, slots: [] }))
    ]);
    setSelectedDateKey("");
    setMessage(`${new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1))} availability reset. Save Availability to apply it.`);
  };

  // -----------------------------
  // LOAD AVAILABILITY (unchanged logic)
  // -----------------------------
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/scheduling/availability");
        const sessionsResponse = await axiosInstance.get("/scheduling/sessions");
        setBookedSessions(sessionsResponse.data.sessions || []);
        const availability = response.data.availability;
        if (availability) {
          const loadedOverrides = (availability.overrides || []).map((override) => ({
            ...override,
            date: toDateInput(override.date)
          }));
          const loadedBlockedSlots = (availability.blocked_slots || []).map((slot) => ({
            ...slot,
            start: toDateTimeInput(slot.start),
            end: toDateTimeInput(slot.end)
          }));
          if (availability.weekly_schedule) setWeeklySchedule(availability.weekly_schedule);
          if (availability.buffer_time !== undefined) setBufferTime(availability.buffer_time);
          if (availability.session_durations) setSessionDurations(availability.session_durations);
          if (availability.timezone) setTimezone(availability.timezone);
          if (availability.overrides) setOverrides(loadedOverrides);
          if (availability.blocked_slots) setBlockedSlots(loadedBlockedSlots);
          setSavedSnapshot(JSON.stringify({
            weekly_schedule: availability.weekly_schedule || [],
            buffer_time: availability.buffer_time ?? 0,
            session_durations: availability.session_durations || [],
            timezone: availability.timezone || "Asia/Kolkata",
            overrides: loadedOverrides,
            blocked_slots: loadedBlockedSlots
          }));
        }
      } catch (error) {
        console.error("Failed to load availability", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAvailability();
  }, []);

  // -----------------------------
  // HANDLERS (unchanged)
  // -----------------------------
  const selectDate = (date) => {
    setSelectedDateKey(dateKey(date));
  };

  const updateSelectedDateOverride = (field, value) => {
    setOverrides((previous) => {
      const index = previous.findIndex((override) => override.date === selectedDateKey);
      if (index === -1) return [...previous, { date: selectedDateKey, available: field === "available" ? value : selectedDateIsAvailable, slots: field === "slots" ? value : selectedDateSlots }];
      return previous.map((override, overrideIndex) => overrideIndex === index ? { ...override, [field]: value } : override);
    });
  };

  const addSelectedDateSlot = () => {
    if (!selectedDateKey || selectedDateSlots.length >= 6) return;
    updateSelectedDateOverride("slots", [...selectedDateSlots, { start: "09:00", end: "10:00" }]);
  };

  const updateSelectedDateSlot = (slotIndex, field, value) => {
    updateSelectedDateOverride("slots", selectedDateSlots.map((slot, index) => index === slotIndex ? { ...slot, [field]: value } : slot));
  };

  const removeSelectedDateSlot = (slotIndex) => {
    updateSelectedDateOverride("slots", selectedDateSlots.filter((_, index) => index !== slotIndex));
  };

  const toggleDuration = (duration) => {
    setSessionDurations((previous) =>
      previous.includes(duration) ? previous.filter((item) => item !== duration) : [...previous, duration].sort((a, b) => a - b)
    );
  };

  const saveAvailability = async () => {
    try {
      setLoading(true);
      setMessage("");
      const payload = {
        weekly_schedule: weeklySchedule,
        buffer_time: bufferTime,
        session_durations: sessionDurations,
        timezone,
        overrides,
        blocked_slots: blockedSlots
      };
      const response = await axiosInstance.put("/scheduling/availability", payload);
      setSavedSnapshot(JSON.stringify(payload));
      setMessage(response.data.message || "Availability saved successfully.");
    } catch (error) {
      console.error(error);
      setMessage("Failed to save availability.");
    } finally {
      setLoading(false);
    }
  };

  const addBlockedSlot = () => {
    setBlockedSlots((previous) => [...previous, { start: "", end: "", reason: "" }]);
  };

  const removeBlockedSlot = (index) => {
    setBlockedSlots((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
  };

  if (loading && weeklySchedule.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center rounded-[28px] bg-[#F8FAFC] text-sm text-[#64748B]">
        <p>Loading schedule...</p>
      </div>
    );
  }

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <section className="mx-auto max-w-[1440px] space-y-10 px-5 py-8 sm:px-8 lg:px-12">
      {/* Header */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[.18em] text-violet-600">
            Practice settings
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-[-.04em] text-[#1E293B] sm:text-4xl">
            Schedule
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#64748B]">
            Manage your weekly availability, session durations and blocked times.
          </p>
        </div>
      </header>

      {/* Weekly Availability */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Calendar size={20} className="text-violet-500" />
            <h2 className="font-display text-2xl font-semibold text-[#1E293B]">Weekly Availability</h2>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-[#64748B]">
            <span>View month</span>
            <input
              type="month"
              value={activeMonth}
              onChange={(event) => {
                setSelectedMonth(event.target.value || currentMonthValue);
              }}
              className="rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm text-[#1E293B] outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </label>
          <button
            type="button"
            onClick={resetMonthAvailability}
            className="rounded-full border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
          >
            Reset Month Availability
          </button>
        </div>
        <p className="text-sm text-[#64748B]">Set the hours during which clients can book sessions.</p>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-[#F8FAFC] p-3 sm:p-4">
          <div className="grid min-w-[560px] grid-cols-7 gap-2 text-center text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName) => <span key={dayName}>{dayName}</span>)}
          </div>
          <div className="mt-2 min-w-[560px] space-y-2">
            {calendarWeeks.map((week, weekIndex) => <div key={weekIndex} className="grid grid-cols-7 gap-2 rounded-xl p-1 transition">
              {week.map((date) => {
                const isActiveMonth = date.getMonth() === Number(activeMonth.split('-')[1]) - 1;
                const slots = getSlotsForDate(date);
                const booked = getBookedSessionsForDate(date);
                return <button key={date.toISOString()} type="button" onClick={() => selectDate(date)} onMouseEnter={(event) => showDateDetails(event, date)} onMouseLeave={() => setHoveredDate(null)} onFocus={(event) => showDateDetails(event, date)} onBlur={() => setHoveredDate(null)} className={`min-h-16 rounded-xl border-2 p-2 text-left transition hover:border-violet-700 hover:bg-violet-50 ${getDayOutlineClass(slots, booked, isActiveMonth)}`}><p className="text-xs font-bold">{date.getDate()}</p><p className="mt-1 text-[10px] font-semibold uppercase tracking-wide">{new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date)}</p></button>;
              })}
            </div>)}
          </div>
        </div>

        {hoveredDate && <div className="pointer-events-none fixed z-[60] w-72 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-xl" style={{ top: hoveredDate.position.top, left: hoveredDate.position.left }}>
          <p className="text-sm font-bold text-[#1E293B]">{hoveredDate.date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Available slots</p>
            {hoveredDate.slots.length ? <div className="mt-2 space-y-1">{hoveredDate.slots.map((slot) => <p key={`${slot.start}-${slot.end}`} className="text-sm font-semibold text-emerald-700">{slot.start} - {slot.end}</p>)}</div> : <p className="mt-2 text-sm text-slate-500">No availability</p>}
          </div>
          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Booked sessions ({hoveredDate.booked.length})</p>
            {hoveredDate.booked.length ? <div className="mt-2 space-y-3">{hoveredDate.booked.map((session) => <div key={session._id} className="text-sm"><p className="font-semibold text-[#1E293B]">{session.client_id?.name || "Client"}</p><p className="text-slate-600">{formatTime(session.starts_at)} - {formatTime(session.ends_at)} · <span className="capitalize">{session.status}</span></p><p className="text-xs text-slate-500">{session.mode === "in_person" ? "In person" : "Online"} · {session.session_code || "Code pending"}</p></div>)}</div> : <p className="mt-2 text-sm text-slate-500">No booked sessions</p>}
          </div>
        </div>}

        <p className="mt-4 rounded-xl bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700">
          Select any date to update its availability. Changes are sent to the backend when you save.
        </p>
      </section>

      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby="date-override-title">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[.18em] text-violet-600">Calendar date</p>
                <h2 id="date-override-title" className="mt-2 font-display text-2xl font-semibold text-[#1E293B]">{selectedDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</h2>
              </div>
              <button type="button" onClick={() => setSelectedDateKey("")} aria-label="Close date editor" className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
            </div>
            <label className="mt-6 flex items-center gap-2 text-sm font-semibold text-[#64748B]">
              <input type="checkbox" checked={selectedDateIsAvailable} onChange={(event) => updateSelectedDateOverride("available", event.target.checked)} className="rounded border-slate-300 text-violet-500 focus:ring-violet-500" />
              Available on this date
            </label>
            {selectedDateIsAvailable && <div className="mt-4 space-y-3">
              {selectedDateSlots.map((slot, slotIndex) => <div key={slotIndex} className="flex flex-wrap items-end gap-3 rounded-xl bg-[#F8FAFC] p-3">
                <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wider text-[#64748B]">Start:
                  <input type="time" value={slot.start} onChange={(event) => updateSelectedDateSlot(slotIndex, "start", event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-[#1E293B]" />
                </label>
                <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wider text-[#64748B]">End:
                  <input type="time" value={slot.end} onChange={(event) => updateSelectedDateSlot(slotIndex, "end", event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-[#1E293B]" />
                </label>
                <button type="button" onClick={() => removeSelectedDateSlot(slotIndex)} className="rounded-full px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50">Remove</button>
              </div>)}
              <button type="button" onClick={addSelectedDateSlot} disabled={selectedDateSlots.length >= 6} className="flex items-center gap-1 text-sm font-bold text-violet-600 disabled:cursor-not-allowed disabled:opacity-50"><Plus size={16} /> Add Time Slot ({selectedDateSlots.length}/6)</button>
            </div>}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setSelectedDateKey("")} className="rounded-full border border-slate-200 px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">Close</button>
              <button type="button" onClick={() => setSelectedDateKey("")} className="rounded-full bg-violet-500 px-5 py-2 text-sm font-bold text-white hover:bg-violet-600">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Session Durations & Buffer Time */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Session Durations */}
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-2 flex items-center gap-3">
            <Clock size={20} className="text-violet-500" />
            <h2 className="font-display text-2xl font-semibold text-[#1E293B]">Session Durations</h2>
          </div>
          <p className="text-sm text-[#64748B]">Select the session durations that clients can book.</p>
          {[30, 45, 60, 90].map((duration) => (
            <label key={duration} className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-[#1E293B] hover:bg-[#F8FAFC]">
              <input
                type="checkbox"
                checked={sessionDurations.includes(duration)}
                onChange={() => toggleDuration(duration)}
                className="rounded border-slate-300 text-violet-500 focus:ring-violet-500"
              />
              {duration} minutes
            </label>
          ))}
        </div>

        {/* Buffer Time */}
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-2 flex items-center gap-3">
            <Settings size={20} className="text-violet-500" />
            <h2 className="font-display text-2xl font-semibold text-[#1E293B]">Buffer Time</h2>
          </div>
          <p className="text-sm text-[#64748B]">Time between two sessions.</p>
          <select
            value={bufferTime}
            onChange={(e) => setBufferTime(Number(e.target.value))}
            className="mt-5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-[#1E293B] outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          >
            <option value={0}>No buffer</option>
            <option value={5}>5 minutes</option>
            <option value={10}>10 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
          </select>
        </div>
      </div>

      {/* Timezone */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="font-display text-2xl font-semibold text-[#1E293B]">Practice timezone</h2>
        <p className="mt-2 text-sm text-[#64748B]">Weekly hours use this timezone. Clients see converted times in their own timezone.</p>
        <input
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          placeholder="Asia/Kolkata"
          className="mt-5 h-11 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 text-sm text-[#1E293B] outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
        />
      </section>

      {/* Blocked Slots */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-2 flex items-center gap-3">
          <AlertCircle size={20} className="text-violet-500" />
          <h2 className="font-display text-2xl font-semibold text-[#1E293B]">Blocked Slots</h2>
        </div>
        <p className="text-sm text-[#64748B]">Block specific times when you don't want clients to book.</p>

        {blockedSlots.map((slot, index) => (
          <div key={index} className="mt-4 grid gap-3 rounded-xl bg-[#F8FAFC] p-4 sm:grid-cols-3">
            <input
              type="datetime-local"
              value={slot.start}
              onChange={(e) => {
                const newSlots = [...blockedSlots];
                newSlots[index].start = e.target.value;
                setBlockedSlots(newSlots);
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1E293B] outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
            <input
              type="datetime-local"
              value={slot.end}
              onChange={(e) => {
                const newSlots = [...blockedSlots];
                newSlots[index].end = e.target.value;
                setBlockedSlots(newSlots);
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1E293B] outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
            <input
              type="text"
              placeholder="Reason"
              value={slot.reason}
              onChange={(e) => {
                const newSlots = [...blockedSlots];
                newSlots[index].reason = e.target.value;
                setBlockedSlots(newSlots);
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1E293B] outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
            <button
              type="button"
              onClick={() => removeBlockedSlot(index)}
              className="rounded-full px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 sm:col-span-3 sm:justify-self-start"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addBlockedSlot}
          className="mt-4 flex items-center gap-1 text-sm font-bold text-violet-600 hover:text-violet-700"
        >
          <Plus size={16} /> Block Time
        </button>
      </section>

      {/* Booked Sessions */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="font-display text-2xl font-semibold text-[#1E293B]">Booked sessions</h2>
        <p className="mt-2 text-sm text-[#64748B]">Session codes are assigned by the system and cannot be changed.</p>
        <div className="mt-5 space-y-3">
          {bookedSessions.map((session) => (
            <div key={session._id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4">
              <div>
                <p className="font-semibold text-[#1E293B]">{session.client_id?.name || "Client"}</p>
                <p className="mt-1 text-sm text-[#64748B]">{new Date(session.starts_at).toLocaleString()} · {session.status}</p>
              </div>
              <strong className="text-violet-600">{session.session_code || "Code pending"}</strong>
            </div>
          ))}
          {!bookedSessions.length && <p className="text-sm text-[#64748B]">No booked sessions yet.</p>}
        </div>
      </section>

      {/* Save */}
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-md sm:p-8">
        {message && (
          <p className="mb-4 rounded-xl bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700">
            {message}
          </p>
        )}
        <button
          type="button"
          onClick={saveAvailability}
          disabled={loading || isSaved}
          className="w-full rounded-full bg-violet-500 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {loading ? "Saving..." : "Save Availability"}
        </button>
      </section>
    </section>
  );
}

export default Schedule;