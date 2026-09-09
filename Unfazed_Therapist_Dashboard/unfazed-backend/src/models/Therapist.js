const mongoose = require("mongoose");

const therapistSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },

    password_hash: {
      type: String,
      required: true
    },

    name: {
      type: String,
      required: true
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },

    bio: {
      type: String,
      default: ""
    },

    profile_image: {
      type: String,
      default: ""
    },

    specializations: {
      type: [String],
      default: []
    },

    languages: {
      type: [String],
      default: []
    },

    session_rate: {
      type: Number,
      default: 1500,
      min: 0
    },

    subscription_tier: {
      type: String,
      default: "free"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Therapist", therapistSchema);