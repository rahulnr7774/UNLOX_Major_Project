const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    session_code: {
      type: String,
      unique: true,
      immutable: true,
      sparse: true,
      match: /^s\d+$/
    },

    therapist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: true
    },

    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true
    },

    starts_at: {
      type: Date,
      required: true
    },

    ends_at: {
      type: Date,
      required: true
    },

    mode: {
      type: String,
      enum: ["online", "in_person"],
      default: "online"
    },

    status: {
      type: String,
      enum: ["scheduled", "confirmed", "completed", "cancelled", "no_show"],
      default: "scheduled"
    },

    started_at: Date,
    ended_at: Date,

    meeting_url: String,
    cancellation_reason: String
  },
  {
    timestamps: true
  }
);

sessionSchema.index({ therapist_id: 1, starts_at: 1 });
sessionSchema.index({ client_id: 1, starts_at: 1 });

module.exports = mongoose.model("Session", sessionSchema);