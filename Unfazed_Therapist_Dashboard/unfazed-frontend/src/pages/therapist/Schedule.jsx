import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";

function Schedule() {

  // -----------------------------
  // STATES
  // -----------------------------

  const [weeklySchedule, setWeeklySchedule] = useState([
    {
      day: 0,
      name: "Sunday",
      enabled: false,
      slots: []
    },
    {
      day: 1,
      name: "Monday",
      enabled: true,
      slots: [
        {
          start: "10:00",
          end: "13:00"
        },
        {
          start: "15:00",
          end: "18:00"
        }
      ]
    },
    {
      day: 2,
      name: "Tuesday",
      enabled: true,
      slots: [
        {
          start: "10:00",
          end: "13:00"
        }
      ]
    },
    {
      day: 3,
      name: "Wednesday",
      enabled: false,
      slots: []
    },
    {
      day: 4,
      name: "Thursday",
      enabled: true,
      slots: [
        {
          start: "10:00",
          end: "13:00"
        },
        {
          start: "15:00",
          end: "18:00"
        }
      ]
    },
    {
      day: 5,
      name: "Friday",
      enabled: true,
      slots: [
        {
          start: "10:00",
          end: "14:00"
        }
      ]
    },
    {
      day: 6,
      name: "Saturday",
      enabled: false,
      slots: []
    }
  ]);


  const [bufferTime, setBufferTime] = useState(0);

  const [sessionDurations, setSessionDurations] = useState([
    30,
    45,
    60,
    90
  ]);


  const [overrides, setOverrides] = useState([]);

  const [blockedSlots, setBlockedSlots] = useState([]);


  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [bookedSessions, setBookedSessions] = useState([]);

  const availabilityPayload = {
    weekly_schedule: weeklySchedule,
    buffer_time: bufferTime,
    session_durations: sessionDurations,
    overrides,
    blocked_slots: blockedSlots
  };
  const isSaved = savedSnapshot === JSON.stringify(availabilityPayload);

  const toDateInput = (value) => value ? new Date(value).toISOString().slice(0, 10) : "";
  const toDateTimeInput = (value) => value ? new Date(value).toISOString().slice(0, 16) : "";

  // -----------------------------
  // LOAD AVAILABILITY
  // -----------------------------

  useEffect(() => {

    const fetchAvailability = async () => {

      try {

        setLoading(true);

        const response = await axiosInstance.get(
          "/scheduling/availability"
        );
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

          if (availability.weekly_schedule) {
            setWeeklySchedule(
              availability.weekly_schedule
            );
          }

          if (availability.buffer_time !== undefined) {
            setBufferTime(
              availability.buffer_time
            );
          }

          if (availability.session_durations) {
            setSessionDurations(
              availability.session_durations
            );
          }

          if (availability.overrides) {
            setOverrides(loadedOverrides);
          }

          if (availability.blocked_slots) {
            setBlockedSlots(loadedBlockedSlots);
          }

          setSavedSnapshot(JSON.stringify({
            weekly_schedule: availability.weekly_schedule || [],
            buffer_time: availability.buffer_time ?? 0,
            session_durations: availability.session_durations || [],
            overrides: loadedOverrides,
            blocked_slots: loadedBlockedSlots
          }));
        }

      } catch (error) {

        console.error(
          "Failed to load availability",
          error
        );

      } finally {

        setLoading(false);

      }
    };

    fetchAvailability();

  }, []);


  // -----------------------------
  // ENABLE / DISABLE DAY
  // -----------------------------

  const toggleDay = (dayIndex) => {

    setWeeklySchedule((previous) => {

      return previous.map((day) => {

        if (day.day !== dayIndex) {
          return day;
        }

        return {
          ...day,
          enabled: !day.enabled
        };

      });

    });

  };


  // -----------------------------
  // ADD TIME SLOT
  // -----------------------------

  const addTimeSlot = (dayIndex) => {

    setWeeklySchedule((previous) => {

      return previous.map((day) => {

        if (day.day !== dayIndex) {
          return day;
        }

        return {
          ...day,

          slots: [
            ...day.slots,

            {
              start: "09:00",
              end: "10:00"
            }
          ]
        };

      });

    });

  };


  // -----------------------------
  // UPDATE TIME SLOT
  // -----------------------------

  const updateTimeSlot = (
    dayIndex,
    slotIndex,
    field,
    value
  ) => {

    setWeeklySchedule((previous) => {

      return previous.map((day) => {

        if (day.day !== dayIndex) {
          return day;
        }

        const updatedSlots =
          day.slots.map((slot, index) => {

            if (index !== slotIndex) {
              return slot;
            }

            return {
              ...slot,
              [field]: value
            };

          });

        return {
          ...day,
          slots: updatedSlots
        };

      });

    });

  };


  // -----------------------------
  // REMOVE TIME SLOT
  // -----------------------------

  const removeTimeSlot = (
    dayIndex,
    slotIndex
  ) => {

    setWeeklySchedule((previous) => {

      return previous.map((day) => {

        if (day.day !== dayIndex) {
          return day;
        }

        return {
          ...day,

          slots: day.slots.filter(
            (_, index) =>
              index !== slotIndex
          )
        };

      });

    });

  };


  // -----------------------------
  // SESSION DURATION
  // -----------------------------

  const toggleDuration = (duration) => {

    setSessionDurations((previous) => {

      if (previous.includes(duration)) {

        return previous.filter(
          (item) => item !== duration
        );

      }

      return [
        ...previous,
        duration
      ].sort((a, b) => a - b);

    });

  };


  // -----------------------------
  // SAVE AVAILABILITY
  // -----------------------------

  const saveAvailability = async () => {

    try {

      setLoading(true);
      setMessage("");

      const payload = {
        weekly_schedule: weeklySchedule,
        buffer_time: bufferTime,
        session_durations: sessionDurations,
        overrides,
        blocked_slots: blockedSlots
      };
      const response = await axiosInstance.put(
        "/scheduling/availability",
        payload
      );

      setSavedSnapshot(JSON.stringify(payload));
      setMessage(response.data.message || "Availability saved successfully.");

    } catch (error) {

      console.error(error);

      setMessage(
        "Failed to save availability."
      );

    } finally {

      setLoading(false);

    }

  };


  // -----------------------------
  // ADD OVERRIDE
  // -----------------------------

  const addOverride = () => {

    setOverrides((previous) => [

      ...previous,

      {
        date: "",
        available: false,
        slots: []
      }

    ]);

  };


  // -----------------------------
  // UPDATE OVERRIDE
  // -----------------------------

  const updateOverride = (
    index,
    field,
    value
  ) => {

    setOverrides((previous) => {

      return previous.map(
        (override, overrideIndex) => {

          if (index !== overrideIndex) {
            return override;
          }

          return {
            ...override,
            [field]: value
          };

        }
      );

    });

  };


  // -----------------------------
  // REMOVE OVERRIDE
  // -----------------------------

  const removeOverride = (index) => {

    setOverrides((previous) => {

      return previous.filter(
        (_, itemIndex) =>
          itemIndex !== index
      );

    });

  };


  // -----------------------------
  // ADD BLOCKED SLOT
  // -----------------------------

  const addBlockedSlot = () => {

    setBlockedSlots((previous) => [

      ...previous,

      {
        start: "",
        end: "",
        reason: ""
      }

    ]);

  };


  // -----------------------------
  // REMOVE BLOCKED SLOT
  // -----------------------------

  const removeBlockedSlot = (index) => {

    setBlockedSlots((previous) => {

      return previous.filter(
        (_, itemIndex) =>
          itemIndex !== index
      );

    });

  };


  // -----------------------------
  // LOADING
  // -----------------------------

  if (loading && weeklySchedule.length === 0) {

    return (
      <div className="flex min-h-[50vh] items-center justify-center rounded-[28px] bg-cream text-sm text-ink/60">
        <p>Loading schedule...</p>
      </div>
    );

  }


  // -----------------------------
  // UI
  // -----------------------------

  return (

    <div className="space-y-8">

      {/* PAGE HEADER */}

      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

        <div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-[.18em] text-moss">Practice settings</p>
        <h1 className="font-display text-3xl font-semibold tracking-[-.04em] text-ink sm:text-4xl">Schedule</h1>

        <p className="mt-3 max-w-xl text-sm leading-6 text-ink/60">
          Manage your weekly availability,
          session durations and blocked times.
        </p>
        </div>

      </header>


      {/* -------------------------------- */}
      {/* WEEKLY AVAILABILITY */}
      {/* -------------------------------- */}

      <section className="rounded-[28px] border border-ink/10 bg-white p-6 shadow-[0_20px_60px_rgba(31,41,36,.04)] sm:p-8">

        <h2 className="font-display text-2xl font-semibold">Weekly Availability</h2>

        <p className="mt-2 text-sm text-ink/60">
          Set the hours during which clients
          can book sessions.
        </p>


        {weeklySchedule.map((day) => (

          <div key={day.day} className="mt-5 rounded-2xl border border-ink/10 p-4 sm:p-5">

            <hr />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-semibold">
              {day.name}
            </h3>


            {/* ENABLE DAY */}

            <label className="inline-flex items-center gap-2 text-sm font-semibold text-ink/65">

              <input
                type="checkbox"
                checked={day.enabled}
                onChange={() =>
                  toggleDay(day.day)
                }
              />

              Available

            </label>
            </div>


            {/* TIME SLOTS */}

            {day.enabled && (

              <div className="mt-4 space-y-3">

                {day.slots.map(
                  (slot, slotIndex) => (

                    <div key={slotIndex} className="flex flex-wrap items-end gap-3 rounded-xl bg-cream p-3">

                      <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wider text-ink/45">
                        Start:
                      </label>

                      <input className="rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-moss"
                        type="time"
                        value={slot.start}
                        onChange={(event) =>
                          updateTimeSlot(
                            day.day,
                            slotIndex,
                            "start",
                            event.target.value
                          )
                        }
                      />


                      <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wider text-ink/45">
                        End:
                      </label>

                      <input className="rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-moss"
                        type="time"
                        value={slot.end}
                        onChange={(event) =>
                          updateTimeSlot(
                            day.day,
                            slotIndex,
                            "end",
                            event.target.value
                          )
                        }
                      />


                      <button className="rounded-full px-3 py-2 text-xs font-bold text-[#9a4932] hover:bg-[#fae2d9]"
                        type="button"
                        onClick={() =>
                          removeTimeSlot(
                            day.day,
                            slotIndex
                          )
                        }
                      >
                        Remove
                      </button>

                    </div>

                  )
                )}


                <button className="text-sm font-bold text-moss hover:text-ink"
                  type="button"
                  onClick={() =>
                    addTimeSlot(day.day)
                  }
                >
                  + Add Time Slot
                </button>

              </div>

            )}

          </div>

        ))}

      </section>


      {/* -------------------------------- */}
      {/* SESSION DURATIONS */}
      {/* -------------------------------- */}

      <section className="grid gap-6 lg:grid-cols-2">

        <div className="rounded-[28px] border border-ink/10 bg-white p-6 sm:p-8">
        <h2 className="font-display text-2xl font-semibold">Session Durations</h2>

        <p className="mt-2 text-sm text-ink/60">
          Select the session durations that
          clients can book.
        </p>


        {[30, 45, 60, 90].map(
          (duration) => (

            <label key={duration} className="mt-3 flex items-center gap-3 rounded-xl border border-ink/10 p-3 text-sm font-semibold hover:bg-cream">

              <input
                type="checkbox"
                checked={sessionDurations.includes(
                  duration
                )}
                onChange={() =>
                  toggleDuration(duration)
                }
              />

              {duration} minutes

            </label>

          )
        )}
        </div>

      </section>


      {/* -------------------------------- */}
      {/* BUFFER TIME */}
      {/* -------------------------------- */}

      <section className="rounded-[28px] border border-ink/10 bg-sage p-6 sm:p-8">

        <h2 className="font-display text-2xl font-semibold">Buffer Time</h2>

        <p className="mt-2 text-sm text-ink/60">
          Time between two sessions.
        </p>

        <select className="mt-5 w-full rounded-xl border border-ink/10 bg-white px-3 py-3 text-sm outline-none focus:border-moss"
          value={bufferTime}
          onChange={(event) =>
            setBufferTime(
              Number(event.target.value)
            )
          }
        >

          <option value={0}>
            No buffer
          </option>

          <option value={5}>
            5 minutes
          </option>

          <option value={10}>
            10 minutes
          </option>

          <option value={15}>
            15 minutes
          </option>

          <option value={30}>
            30 minutes
          </option>

        </select>

      </section>


      {/* -------------------------------- */}
      {/* ONE TIME OVERRIDES */}
      {/* -------------------------------- */}

      <section className="rounded-[28px] border border-ink/10 bg-white p-6 sm:p-8">

        <h2 className="font-display text-2xl font-semibold">One-Time Overrides</h2>

        <p className="mt-2 text-sm text-ink/60">
          Change your availability for a
          specific date.
        </p>


        {overrides.map(
          (override, index) => (

            <div key={index} className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-cream p-4">

              <label>
                Date:
              </label>

              <input className="rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-moss"
                type="date"
                value={override.date}
                onChange={(event) =>
                  updateOverride(
                    index,
                    "date",
                    event.target.value
                  )
                }
              />


              <label className="flex items-center gap-2 text-sm font-semibold text-ink/65">

                <input
                  type="checkbox"
                  checked={override.available}
                  onChange={(event) =>
                    updateOverride(
                      index,
                      "available",
                      event.target.checked
                    )
                  }
                />

                Available on this date

              </label>


              <button className="rounded-full px-3 py-2 text-xs font-bold text-[#9a4932] hover:bg-[#fae2d9]"
                type="button"
                onClick={() =>
                  removeOverride(index)
                }
              >
                Remove
              </button>

            </div>

          )
        )}


        <button className="mt-4 text-sm font-bold text-moss hover:text-ink"
          type="button"
          onClick={addOverride}
        >
          + Add Override
        </button>

      </section>


      {/* -------------------------------- */}
      {/* BLOCKED SLOTS */}
      {/* -------------------------------- */}

      <section className="rounded-[28px] border border-ink/10 bg-white p-6 sm:p-8">

        <h2 className="font-display text-2xl font-semibold">Blocked Slots</h2>

        <p className="mt-2 text-sm text-ink/60">
          Block specific times when you
          don't want clients to book.
        </p>


        {blockedSlots.map(
          (slot, index) => (

            <div key={index} className="mt-4 grid gap-3 rounded-xl bg-cream p-4 sm:grid-cols-3">

              <input className="rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-moss"
                type="datetime-local"
                value={slot.start}
                onChange={(event) => {

                  setBlockedSlots(
                    (previous) => {

                      return previous.map(
                        (item, itemIndex) => {

                          if (
                            itemIndex !== index
                          ) {
                            return item;
                          }

                          return {
                            ...item,
                            start:
                              event.target.value
                          };

                        }
                      );

                    }
                  );

                }}
              />


              <input className="rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-moss"
                type="datetime-local"
                value={slot.end}
                onChange={(event) => {

                  setBlockedSlots(
                    (previous) => {

                      return previous.map(
                        (item, itemIndex) => {

                          if (
                            itemIndex !== index
                          ) {
                            return item;
                          }

                          return {
                            ...item,
                            end:
                              event.target.value
                          };

                        }
                      );

                    }
                  );

                }}
              />


              <input className="rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-moss"
                type="text"
                placeholder="Reason"
                value={slot.reason}
                onChange={(event) => {

                  setBlockedSlots(
                    (previous) => {

                      return previous.map(
                        (item, itemIndex) => {

                          if (
                            itemIndex !== index
                          ) {
                            return item;
                          }

                          return {
                            ...item,
                            reason:
                              event.target.value
                          };

                        }
                      );

                    }
                  );

                }}
              />


              <button className="rounded-full px-3 py-2 text-xs font-bold text-[#9a4932] hover:bg-[#fae2d9] sm:col-span-3 sm:justify-self-start"
                type="button"
                onClick={() =>
                  removeBlockedSlot(index)
                }
              >
                Remove
              </button>

            </div>

          )
        )}


        <button className="mt-4 text-sm font-bold text-moss hover:text-ink"
          type="button"
          onClick={addBlockedSlot}
        >
          + Block Time
        </button>

      </section>


      {/* -------------------------------- */}
      {/* SAVE */}
      {/* -------------------------------- */}

      <section className="rounded-[28px] border border-ink/10 bg-white p-4 shadow-[0_20px_60px_rgba(31,41,36,.08)] sm:p-5">
      <section className="rounded-[28px] border border-ink/10 bg-white p-6 sm:p-8">
        <h2 className="font-display text-2xl font-semibold">Booked sessions</h2>
        <p className="mt-2 text-sm text-ink/60">Session codes are assigned by the system and cannot be changed.</p>
        <div className="mt-5 space-y-3">
          {bookedSessions.map((session) => (
            <div key={session._id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-cream p-4">
              <div><p className="font-semibold">{session.client_id?.name || "Client"}</p><p className="mt-1 text-sm text-ink/55">{new Date(session.starts_at).toLocaleString()} · {session.status}</p></div>
              <strong className="text-moss">{session.session_code || "Code pending"}</strong>
            </div>
          ))}
          {!bookedSessions.length && <p className="text-sm text-ink/55">No booked sessions yet.</p>}
        </div>
      </section>

        {message && (
          <p className="mb-3 rounded-xl bg-sage px-4 py-3 text-sm font-semibold text-moss">{message}</p>
        )}

        <button className="w-full rounded-full bg-ink px-6 py-3 text-sm font-bold text-white hover:bg-moss disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          type="button"
          onClick={saveAvailability}
          disabled={loading || isSaved}
        >
          {loading
            ? "Saving..."
            : "Save Availability"}
        </button>

      </section>

    </div>

  );
}

export default Schedule;