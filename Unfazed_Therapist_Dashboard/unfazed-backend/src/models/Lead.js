const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    therapist_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      default: null
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      lowercase: true,
      trim: true
    },

    phone: {
      type: String,
      trim: true
    },

    source: {
      type: String,
      enum: [
        "website",
        "referral",
        "social_media",
        "other"
      ],
      default: "website"
    },

    status: {
      type: String,
      enum: [
        "new",
        "contacted",
        "converted",
        "lost"
      ],
      default: "new"
    },

    message: {
      type: String,
      default: ""
    },

    converted_client_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client"
    },

    presenting_concern: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Lead", leadSchema);