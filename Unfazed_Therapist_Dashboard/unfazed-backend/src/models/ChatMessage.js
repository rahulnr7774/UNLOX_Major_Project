const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  session_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
    index: true
  },
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  sender_role: {
    type: String,
    enum: ['therapist', 'client'],
    required: true
  },
  sender_name: {
    type: String,
    required: true
  },
  receiver_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  receiver_name: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  sent_at: {
    type: Date,
    default: Date.now
  },
  read_at: Date,
  expires_at: {
    type: Date,
    default: () => new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    index: { expireAfterSeconds: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
