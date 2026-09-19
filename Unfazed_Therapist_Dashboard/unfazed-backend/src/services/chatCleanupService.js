const ChatMessage = require('../models/ChatMessage');
const Session = require('../models/Session');
const { processNotificationJobs } = require('./notificationService');

async function removeExpiredChatMessages() {
  const result = await ChatMessage.deleteMany({ expires_at: { $lte: new Date() } });
  if (result.deletedCount) console.log(`Removed ${result.deletedCount} expired chat messages`);
}

async function removeExpiredSessions() {
  const result = await Session.deleteMany({ ends_at: { $lte: new Date() } });
  if (result.deletedCount) console.log(`Removed ${result.deletedCount} expired sessions`);
}

function startChatCleanupJob() {
  const interval = setInterval(() => {
    removeExpiredChatMessages().catch((error) => console.error('Chat cleanup failed:', error.message));
    removeExpiredSessions().catch((error) => console.error('Session cleanup failed:', error.message));
  }, 60 * 60 * 1000);
  interval.unref?.();
  removeExpiredChatMessages().catch((error) => console.error('Initial chat cleanup failed:', error.message));
  removeExpiredSessions().catch((error) => console.error('Initial session cleanup failed:', error.message));
  processNotificationJobs().catch((error) => console.error('Initial notification job failed:', error.message));
  const notificationInterval = setInterval(() => {
    processNotificationJobs().catch((error) => console.error('Notification job failed:', error.message));
  }, 10 * 60 * 1000);
  notificationInterval.unref?.();
  return interval;
}

module.exports = { removeExpiredChatMessages, removeExpiredSessions, startChatCleanupJob };
