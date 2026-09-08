const mongoose = require("mongoose");

const subscriptionTierConfigSchema = new mongoose.Schema(
  {
    tier_name: {
      type: String,
      required: true,
      unique: true
    },

    price: {
      type: Number,
      min: 0,
      default: null
    },

    billing_cycle: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly"
    },

    caps: {
      active_clients: {
        type: Number,
        default: null
      },

      sessions_per_month: {
        type: Number,
        default: null
      },

      storage_mb: {
        type: Number,
        default: null
      }
    },

    feature_flags: {
      chat: {
        type: Boolean,
        default: false
      },

      analytics: {
        type: Boolean,
        default: false
      },

      advanced_analytics: {
        type: Boolean,
        default: false
      },

      note_templates: {
        type: Boolean,
        default: false
      },

      shared_notes: {
        type: Boolean,
        default: false
      },

      packages: {
        type: Boolean,
        default: false
      }
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

module.exports = mongoose.model(
  "SubscriptionTierConfig",
  subscriptionTierConfigSchema
);