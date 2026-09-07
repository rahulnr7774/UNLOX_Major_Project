const mongoose = require("mongoose");

const clientPackageSchema = new mongoose.Schema(
  {
    client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true
    },

    therapist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: true
    },

    package_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true
    },

    total_sessions: {
      type: Number,
      required: true
    },

    sessions_used: {
      type: Number,
      default: 0
    },

    sessions_remaining: {
      type: Number,
      required: true
    },

    purchased_at: {
      type: Date,
      default: Date.now
    },

    expires_at: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: ["active", "expired", "completed"],
      default: "active"
    },

    payment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("ClientPackage", clientPackageSchema);