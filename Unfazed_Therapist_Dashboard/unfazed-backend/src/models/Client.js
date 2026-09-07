const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    therapist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      trim: true,
      lowercase: true
    },

    password_hash: {
      type: String,
      select: false
    },

    phone: {
      type: String,
      trim: true
    },

    date_of_birth: {
      type: Date
    },

    gender: {
      type: String
    },

    presenting_concern: {
      type: String
    },

    history: {
      type: String
    },

    tags: {
      type: [String],
      default: []
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },

    intake: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    consent: {
      accepted: {
        type: Boolean,
        default: false
      },

      timestamp: {
        type: Date
      }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Client", clientSchema);