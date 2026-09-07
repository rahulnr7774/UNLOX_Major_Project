const ChatMessage = require('../models/ChatMessage');

async function removeExpiredChatMessages() {
  const result = await ChatMessage.deleteMany({ expires_at: { $lte: new Date() } });
  if (result.deletedCount) console.log(`Removed ${result.deletedCount} expired chat messages`);
}

function startChatCleanupJob() {
  const interval = setInterval(() => {
    removeExpiredChatMessages().catch((error) => console.error('Chat cleanup failed:', error.message));
  }, 60 * 60 * 1000);
  interval.unref?.();
  removeExpiredChatMessages().catch((error) => console.error('Initial chat cleanup failed:', error.message));
  return interval;
}

module.exports = { removeExpiredChatMessages, startChatCleanupJob };
