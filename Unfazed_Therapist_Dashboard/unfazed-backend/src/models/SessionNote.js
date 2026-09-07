const mongoose = require("mongoose");

const sessionNoteSchema = new mongoose.Schema(
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
      ref: "Session",
      required: true
    },

    type: {
      type: String,
      enum: ["private", "shared"],
      required: true
    },

    content: {
      type: String,
      required: true
    },

    format: {
      type: String,
      enum: ["freeform", "SOAP", "DAP"],
      default: "freeform"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("SessionNote", sessionNoteSchema);