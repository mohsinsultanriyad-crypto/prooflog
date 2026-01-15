const mongoose = require("mongoose");

const WorkSessionSchema = new mongoose.Schema(
  {
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: "Worker", required: true },
    siteId: { type: mongoose.Schema.Types.ObjectId, ref: "Site", required: true },
    date: { type: String, required: true }, // "YYYY-MM-DD"

    startAt: { type: Date },
    endAt: { type: Date },

    startLoc: { lat: Number, lng: Number, accuracy: Number, distanceMeters: Number },
    endLoc: { lat: Number, lng: Number, accuracy: Number, distanceMeters: Number },

    startPhotoUrl: { type: String, default: "" },
    endPhotoUrl: { type: String, default: "" },

    // calculated hours
    workedMinutes: { type: Number, default: 0 },
    otMinutes: { type: Number, default: 0 },

    flags: {
      startOutOfRange: { type: Boolean, default: false },
      endOutOfRange: { type: Boolean, default: false },
      lowAccuracy: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WorkSession", WorkSessionSchema);