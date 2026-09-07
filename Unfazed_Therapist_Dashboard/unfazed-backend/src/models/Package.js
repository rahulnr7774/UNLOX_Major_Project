const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema(
  {
    therapist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: true
    },

    name: {
      type: String,
      required: true
    },

    session_count: {
      type: Number,
      min: 1,
      max: 50,
      required: true
    },

    per_session_rate: {
      type: Number,
      required: true
    },

    total_price: {
      type: Number,
      required: true
    },

    expiry_days: {
      type: Number,
      required: true
    },

    description: {
      type: String,
      default: ""
    },

    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Package", packageSchema);