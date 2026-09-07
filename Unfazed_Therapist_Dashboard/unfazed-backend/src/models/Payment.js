const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
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

    session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session"
    },

    client_package_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClientPackage"
    },

    package_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package"
    },

    starts_at: Date,

    ends_at: Date,

    duration: Number,

    gateway_transaction_id: {
      type: String,
      required: true,
      unique: true
    },

    amount: {
      type: Number,
      required: true
    },

    platform_fee: {
      type: Number,
      required: true,
      default: 0
    },

    net_amount: {
      type: Number,
      required: true
    },

    currency: {
      type: String,
      default: "INR"
    },

    status: {
      type: String,
      enum: [
        "created",
        "pending",
        "paid",
        "failed",
        "refunded"
      ],
      default: "created"
    },

    payment_method: {
      type: String
    },

    invoice_url: {
      type: String
    },

    paid_at: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Payment", paymentSchema);