const { sendEmail } = require('./emailServices');
const Notification = require('../models/Notification');
const Session = require('../models/Session');

async function sendNotification({ channel, recipient, subject, message }) {
  if (channel !== 'email') {
    console.log(`[notification:${channel}] ${recipient} - ${subject}: ${message}`);
    return { delivered: false, channel, recipient };
  }

  const result = await sendEmail({ to: recipient, subject, text: message, html: `<p>${message}</p>` });
  return { delivered: true, channel, recipient, messageId: result.messageId };
}

async function recordNotification({ event, recipientId, recipientRole, recipientEmail, subject, message, metadata = {}, dedupeKey }) {
  let notification = await Notification.findOne({ dedupe_key: dedupeKey });
  if (notification?.status === 'sent') return notification;
  if (!notification) {
    notification = await Notification.create({ event, recipient_id: recipientId, recipient_role: recipientRole, channel: 'email', subject, message, metadata, dedupe_key: dedupeKey });
  }

  if (!recipientEmail) {
    notification.status = 'failed';
    notification.error = 'Recipient email is unavailable';
    await notification.save();
    return notification;
  }

  try {
    await sendNotification({ channel: 'email', recipient: recipientEmail, subject, message });
    notification.status = 'sent';
    notification.sent_at = new Date();
    notification.error = undefined;
  } catch (error) {
    notification.status = 'failed';
    notification.error = error.message;
  }
  await notification.save();
  return notification;
}

async function notifyBookingConfirmed(sessionId) {
  const session = await Session.findById(sessionId).populate('client_id', 'name email').populate('therapist_id', 'name email');
  if (!session) return;
  const when = new Date(session.starts_at).toLocaleString();
  await Promise.all([
    recordNotification({ event: 'booking_confirmed', recipientId: session.client_id._id, recipientRole: 'client', recipientEmail: session.client_id.email, subject: 'Your therapy session is confirmed', message: `Your session with ${session.therapist_id.name} is confirmed for ${when}.`, metadata: { session_id: session._id }, dedupeKey: `booking-confirmed:${session._id}:client` }),
    recordNotification({ event: 'booking_confirmed', recipientId: session.therapist_id._id, recipientRole: 'therapist', recipientEmail: session.therapist_id.email, subject: 'A therapy session is confirmed', message: `Your session with ${session.client_id.name} is confirmed for ${when}.`, metadata: { session_id: session._id }, dedupeKey: `booking-confirmed:${session._id}:therapist` })
  ]);
}

async function notifySessionReminder(session) {
  const populated = session.client_id?.email ? session : await Session.findById(session._id).populate('client_id', 'name email').populate('therapist_id', 'name');
  if (!populated?.client_id?.email) return;
  await recordNotification({ event: 'session_reminder_24h', recipientId: populated.client_id._id, recipientRole: 'client', recipientEmail: populated.client_id.email, subject: 'Your therapy session is tomorrow', message: `Reminder: your session with ${populated.therapist_id.name} is scheduled for ${new Date(populated.starts_at).toLocaleString()}.`, metadata: { session_id: populated._id }, dedupeKey: `session-reminder-24h:${populated._id}:client` });
}

async function notifyPostSessionFollowUp(sessionId) {
  const session = await Session.findById(sessionId).populate('client_id', 'name email').populate('therapist_id', 'name');
  if (!session?.client_id?.email) return;
  await recordNotification({ event: 'post_session_follow_up', recipientId: session.client_id._id, recipientRole: 'client', recipientEmail: session.client_id.email, subject: 'How are you feeling after your session?', message: `We hope your session with ${session.therapist_id.name} was helpful. You can return to your Unfazed portal to book your next step.`, metadata: { session_id: session._id }, dedupeKey: `post-session-follow-up:${session._id}:client` });
}

async function processNotificationJobs() {
  const now = Date.now();
  const sessions = await Session.find({ status: { $in: ['scheduled', 'confirmed'] }, starts_at: { $gte: new Date(now + 23 * 60 * 60 * 1000), $lte: new Date(now + 25 * 60 * 60 * 1000) } }).select('_id client_id starts_at');
  await Promise.all(sessions.map(notifySessionReminder));
}

module.exports = { sendNotification, recordNotification, notifyBookingConfirmed, notifyPostSessionFollowUp, processNotificationJobs };
