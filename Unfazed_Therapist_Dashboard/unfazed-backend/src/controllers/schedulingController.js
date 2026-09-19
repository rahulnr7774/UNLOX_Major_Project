const Availability = require('../models/Availability');
const Session = require('../models/Session');
const Client = require('../models/Client');
const { sendNotification, recordNotification } = require('../services/notificationService');
const { notifyBookingConfirmed, notifyPostSessionFollowUp } = require('../services/notificationService');
const { nextSessionCode } = require('../utils/sessionCode');

const allowedDurations = [30, 45, 60, 90];

function dateKeyInTimeZone(value, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timeZone || 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date(value)).reduce((result, part) => {
    if (part.type !== 'literal') result[part.type] = part.value;
    return result;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

async function getAvailability(req, res) {
  const availability = await Availability.findOne({ therapist_id: req.therapist._id });
  return res.status(200).json({ availability });
}

async function listWaitlist(req, res) {
  const availability = await Availability.findOne({ therapist_id: req.therapist._id })
    .populate('waitlist.client_id', 'name email phone')
    .lean();
  const waitlist = (availability?.waitlist || []).sort((left, right) => {
    if (left.status !== right.status) return left.status === 'waiting' ? -1 : 1;
    return new Date(left.created_at) - new Date(right.created_at);
  });
  return res.status(200).json({ waitlist });
}

async function openWaitlistSlot(req, res) {
  const { start_time: startTime, end_time: endTime, duration: requestedDuration } = req.body;
  const duration = Number(requestedDuration);
  if (!/^\d{2}:\d{2}$/.test(startTime || '') || !/^\d{2}:\d{2}$/.test(endTime || '')) {
    return res.status(400).json({ message: 'A valid start and end time are required' });
  }
  if (!allowedDurations.includes(duration)) return res.status(400).json({ message: 'Choose a session duration of 30, 45, 60 or 90 minutes' });

  const availability = await Availability.findOne({ therapist_id: req.therapist._id });
  const entry = availability?.waitlist?.id(req.params.entryId);
  if (!availability || !entry) return res.status(404).json({ message: 'Waitlist request not found' });
  if (entry.status !== 'waiting') return res.status(409).json({ message: 'This waitlist request has already been notified' });

  const startMinutes = Number(startTime.slice(0, 2)) * 60 + Number(startTime.slice(3));
  const endMinutes = Number(endTime.slice(0, 2)) * 60 + Number(endTime.slice(3));
  if (startMinutes >= endMinutes || endMinutes - startMinutes !== duration) {
    return res.status(400).json({ message: `Choose a slot that is exactly ${duration} minutes long` });
  }

  const existingOverride = availability.overrides.find((override) => dateKeyInTimeZone(override.date, availability.timezone) === entry.date);
  if (existingOverride) {
    existingOverride.available = true;
    existingOverride.slots.push({ start: startTime, end: endTime });
  } else {
    availability.overrides.push({ date: new Date(`${entry.date}T12:00:00.000Z`), available: true, slots: [{ start: startTime, end: endTime }] });
  }

  entry.duration = duration;
  entry.status = 'notified';
  entry.notified_at = new Date();
  await availability.save();

  const client = await Client.findById(entry.client_id).select('name email');
  const subject = 'A session slot is now available';
  const message = `Hi ${client?.name || 'there'}, a ${duration}-minute session is now available on ${entry.date} from ${startTime} to ${endTime}. Please sign in to Unfazed to book it.`;
  let emailStatus = 'unavailable';
  if (client?.email) {
    const notification = await recordNotification({
      event: 'waitlist_slot_available',
      recipientId: client._id,
      recipientRole: 'client',
      recipientEmail: client.email,
      subject,
      message,
      metadata: { therapist_id: req.therapist._id, date: entry.date, duration },
      dedupeKey: `waitlist-slot:${entry._id}`
    });
    emailStatus = notification.status;
  }

  return res.status(200).json({ message: emailStatus === 'sent' ? 'The slot is open and the client has been notified.' : 'The slot is open, but the client email could not be delivered.', emailStatus, waitlistEntry: entry });
}

async function cancelWaitlist(req, res) {
  const availability = await Availability.findOne({ therapist_id: req.therapist._id });
  const entry = availability?.waitlist?.id(req.params.entryId);
  if (!availability || !entry) return res.status(404).json({ message: 'Waitlist request not found' });
  if (entry.status !== 'waiting') return res.status(409).json({ message: 'Only waiting requests can be cancelled' });

  entry.status = 'cancelled';
  await availability.save();

  const client = await Client.findById(entry.client_id).select('name email');
  if (client?.email) {
    await recordNotification({
      event: 'waitlist_cancelled',
      recipientId: client._id,
      recipientRole: 'client',
      recipientEmail: client.email,
      subject: 'Your waitlist request was closed',
      message: `Hi ${client.name || 'there'}, your waitlist request for a ${entry.duration}-minute session on ${entry.date} was closed by your therapist. You can join the waitlist again from the booking page.`,
      metadata: { therapist_id: req.therapist._id, date: entry.date, duration: entry.duration },
      dedupeKey: `waitlist-cancelled:${entry._id}`
    });
  }

  return res.status(200).json({ message: 'The waitlist request was cancelled.', waitlistEntry: entry });
}

async function saveAvailability(req, res) {
  const payload = {
    weekly_schedule: req.body.weekly_schedule || [],
    buffer_time: req.body.buffer_time ?? 0,
    session_durations: req.body.session_durations || [],
    overrides: req.body.overrides || [],
    blocked_slots: req.body.blocked_slots || [],
    timezone: req.body.timezone || 'Asia/Kolkata'
  };
  const hasTooManySlots = [...payload.weekly_schedule, ...payload.overrides].some((item) => (item.slots || []).length > 6);
  if (hasTooManySlots) {
    return res.status(400).json({ message: 'Each day can have a maximum of 6 slots.' });
  }
  if (!payload.session_durations.length || payload.session_durations.some((duration) => !allowedDurations.includes(Number(duration)))) {
    return res.status(400).json({ message: 'Select at least one session duration: 30, 45, 60 or 90 minutes.' });
  }
  if (Number(payload.buffer_time) < 0 || Number(payload.buffer_time) > 180) {
    return res.status(400).json({ message: 'Buffer time must be between 0 and 180 minutes.' });
  }
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: payload.timezone }).format();
  } catch {
    return res.status(400).json({ message: 'Enter a valid IANA timezone, such as Asia/Kolkata.' });
  }
  const existing = await Availability.findOne({ therapist_id: req.therapist._id });

  if (existing) {
    const current = {
      weekly_schedule: existing.weekly_schedule.map((day) => ({
        day: day.day,
        enabled: day.enabled,
        slots: day.slots.map((slot) => ({ start: slot.start, end: slot.end }))
      })),
      buffer_time: existing.buffer_time,
      session_durations: existing.session_durations,
      overrides: existing.overrides.map((override) => ({
        date: new Date(override.date).toISOString(),
        available: override.available,
        slots: override.slots.map((slot) => ({ start: slot.start, end: slot.end }))
      })),
      blocked_slots: existing.blocked_slots.map((slot) => ({
        start: new Date(slot.start).toISOString(),
        end: new Date(slot.end).toISOString(),
        reason: slot.reason || ''
      })),
      timezone: existing.timezone
    };
    const normalizedPayload = {
      ...payload,
      overrides: payload.overrides.map((override) => ({ ...override, date: new Date(override.date).toISOString() })),
      blocked_slots: payload.blocked_slots.map((slot) => ({ ...slot, start: new Date(slot.start).toISOString(), end: new Date(slot.end).toISOString(), reason: slot.reason || '' }))
    };

    if (JSON.stringify(current) === JSON.stringify(normalizedPayload)) {
      return res.status(200).json({ availability: existing, unchanged: true, message: 'Availability is already up to date.' });
    }
  }

  const availability = await Availability.findOneAndUpdate(
    { therapist_id: req.therapist._id },
    { ...payload, therapist_id: req.therapist._id },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  return res.status(200).json({ availability });
}

async function listSessions(req, res) {
  const filter = { therapist_id: req.therapist._id };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.from || req.query.to) filter.starts_at = {};
  if (req.query.from) filter.starts_at.$gte = new Date(req.query.from);
  if (req.query.to) filter.starts_at.$lte = new Date(req.query.to);
  const sessions = await Session.find(filter).populate('client_id', 'name email phone').sort({ starts_at: 1 });
  return res.status(200).json({ sessions });
}

async function createSession(req, res) {
  const { client_id, starts_at, ends_at } = req.body;
  if (!client_id || !starts_at || !ends_at) return res.status(400).json({ message: 'client_id, starts_at and ends_at are required' });
  const start = new Date(starts_at);
  const end = new Date(ends_at);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start <= new Date() || end <= start) return res.status(400).json({ message: 'Sessions must start in the future and end after they start' });
  const client = await Client.findOne({ _id: client_id, therapist_id: req.therapist._id });
  if (!client) return res.status(404).json({ message: 'Client not found' });

  const conflict = await Session.exists({ therapist_id: req.therapist._id, status: { $in: ['scheduled', 'confirmed'] }, starts_at: { $lt: end }, ends_at: { $gt: start } });
  if (conflict) return res.status(409).json({ message: 'This time overlaps another session' });

  const session = await Session.create({ ...req.body, session_code: await nextSessionCode(), therapist_id: req.therapist._id });
  if (client.email) await sendNotification({ channel: 'email', recipient: client.email, subject: 'Session scheduled', message: `Your session is scheduled for ${new Date(starts_at).toISOString()}.` });
  if (session.status === 'confirmed') notifyBookingConfirmed(session._id).catch((error) => console.error('[notification] booking confirmation failed:', error.message));
  return res.status(201).json({ session });
}

async function updateSession(req, res) {
  if (req.body.starts_at || req.body.ends_at) {
    const currentSession = await Session.findOne({ _id: req.params.id, therapist_id: req.therapist._id }).select('starts_at ends_at');
    const start = new Date(req.body.starts_at || currentSession?.starts_at);
    const end = new Date(req.body.ends_at || currentSession?.ends_at);
    if (!currentSession || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start <= new Date() || end <= start) return res.status(400).json({ message: 'Sessions must start in the future and end after they start' });
  }
  const previous = await Session.findOne({ _id: req.params.id, therapist_id: req.therapist._id });
  const session = await Session.findOneAndUpdate({ _id: req.params.id, therapist_id: req.therapist._id }, req.body, { new: true, runValidators: true }).populate('client_id', 'name email');
  if (!session) return res.status(404).json({ message: 'Session not found' });
  if (previous?.status !== 'confirmed' && session.status === 'confirmed') notifyBookingConfirmed(session._id).catch((error) => console.error('[notification] booking confirmation failed:', error.message));
  if (previous?.status !== 'completed' && session.status === 'completed') notifyPostSessionFollowUp(session._id).catch((error) => console.error('[notification] follow-up failed:', error.message));
  if (previous?.status !== 'cancelled' && session.status === 'cancelled') {
    const availability = await Availability.findOne({ therapist_id: req.therapist._id });
    const duration = Math.round((new Date(session.ends_at) - new Date(session.starts_at)) / 60000);
    const next = availability?.waitlist?.find((entry) => entry.status === 'waiting' && entry.date === dateKeyInTimeZone(session.starts_at, availability.timezone) && entry.duration === duration);
    if (next) {
      next.status = 'notified';
      next.notified_at = new Date();
      await availability.save();
      const client = await Client.findById(next.client_id).select('name email');
      if (client?.email) await sendNotification({ channel: 'email', recipient: client.email, subject: 'A session slot is available', message: `A ${duration}-minute session slot may be available on ${next.date}. Please return to Unfazed to book it.` });
    }
  }
  return res.status(200).json({ session });
}

async function startSession(req, res) {
  const currentSession = await Session.findOne({
    _id: req.params.id,
    therapist_id: req.therapist._id,
    status: { $in: ['scheduled', 'confirmed'] }
  });
  if (!currentSession) return res.status(404).json({ message: 'Session not found or cannot be started' });

  const startedAt = new Date();
  const duration = new Date(currentSession.ends_at).getTime() - new Date(currentSession.starts_at).getTime();
  if (!Number.isFinite(duration) || duration <= 0) return res.status(400).json({ message: 'This session has an invalid duration' });

  const session = await Session.findOneAndUpdate(
    { _id: currentSession._id, therapist_id: req.therapist._id, status: { $in: ['scheduled', 'confirmed'] } },
    { started_at: startedAt, ends_at: new Date(startedAt.getTime() + duration), status: 'confirmed' },
    { new: true }
  ).populate('client_id', 'name email');
  if (!session) return res.status(409).json({ message: 'This session has already been started or changed' });
  notifyBookingConfirmed(session._id).catch((error) => console.error('[notification] booking confirmation failed:', error.message));
  req.app.get('io')?.to(`session-wait:${session._id}`).emit('session:started', { sessionId: String(session._id), endsAt: session.ends_at });
  return res.status(200).json({ session });
}

async function endSession(req, res) {
  const session = await Session.findOneAndUpdate(
    { _id: req.params.id, therapist_id: req.therapist._id, started_at: { $exists: true }, status: 'confirmed' },
    { status: 'completed', ended_at: new Date() },
    { new: true }
  ).populate('client_id', 'name email');
  if (!session) return res.status(404).json({ message: 'Session not found or already ended' });
  notifyPostSessionFollowUp(session._id).catch((error) => console.error('[notification] follow-up failed:', error.message));
  req.app.get('io')?.to(`conversation:${session._id}`).emit('session:ended', { sessionId: String(session._id) });
  req.app.get('io')?.to(`session-wait:${session._id}`).emit('session:ended', { sessionId: String(session._id) });
  return res.status(200).json({ session });
}

module.exports = { getAvailability, saveAvailability, listWaitlist, openWaitlistSlot, cancelWaitlist, listSessions, createSession, updateSession, startSession, endSession };
