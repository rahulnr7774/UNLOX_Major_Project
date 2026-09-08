const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    event: {
      type: String,
      enum: ['booking_confirmed', 'session_reminder_24h', 'post_session_follow_up', 'note_shared', 'system'],
      required: true
    },
    recipient_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    recipient_role: {
      type: String,
      enum: ['client', 'therapist'],
      required: true
    },
    channel: {
      type: String,
      enum: ['email'],
      default: 'email'
    },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending'
    },
    dedupe_key: { type: String, required: true, unique: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    sent_at: Date,
    error: String
  },
  { timestamps: true }
);

notificationSchema.index({ recipient_id: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
