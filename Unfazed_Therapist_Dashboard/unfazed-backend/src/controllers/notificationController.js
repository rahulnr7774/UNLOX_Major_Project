const Notification = require('../models/Notification');

function recipientFilter(req) {
  const recipient = req.client || req.therapist;
  return { recipient_id: recipient._id };
}

async function listNotifications(req, res) {
  const filter = recipientFilter(req);
  const [notifications, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(100).lean(),
    Notification.countDocuments({ ...filter, read_at: null })
  ]);
  return res.status(200).json({ notifications, unreadCount });
}

async function markNotificationRead(req, res) {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, ...recipientFilter(req) },
    { read_at: new Date() },
    { new: true }
  ).lean();
  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  return res.status(200).json({ notification });
}

async function markAllNotificationsRead(req, res) {
  await Notification.updateMany({ ...recipientFilter(req), read_at: null }, { read_at: new Date() });
  return res.status(200).json({ message: 'Notifications marked as read' });
}

module.exports = { listNotifications, markNotificationRead, markAllNotificationsRead };
