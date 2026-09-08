const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema(
  {
    therapist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: true
    },

    weekly_schedule: [
      {
        day: {
          type: Number,
          min: 0,
          max: 6,
          required: true
        },

        enabled: {
          type: Boolean,
          default: true
        },

        slots: [
          {
            start: {
              type: String,
              required: true
            },

            end: {
              type: String,
              required: true
            }
          }
        ]
      }
    ],

    overrides: [
      {
        date: {
          type: Date,
          required: true
        },

        available: {
          type: Boolean,
          default: false
        },

        slots: [
          {
            start: String,
            end: String
          }
        ]
      }
    ],

    blocked_slots: [
      {
        start: {
          type: Date,
          required: true
        },

        end: {
          type: Date,
          required: true
        },

        reason: {
          type: String
        }
      }
    ],

    buffer_time: {
      type: Number,
      default: 0
    },

    session_durations: {
      type: [Number],
      default: [30, 45, 60, 90]
    },

    timezone: {
      type: String,
      default: "Asia/Kolkata"
    },

    waitlist: [
      {
        client_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Client",
          required: true
        },
        date: {
          type: String,
          required: true
        },
        duration: {
          type: Number,
          enum: [30, 45, 60, 90],
          required: true
        },
        status: {
          type: String,
          enum: ["waiting", "notified"],
          default: "waiting"
        },
        notified_at: Date,
        created_at: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Availability", availabilitySchema);