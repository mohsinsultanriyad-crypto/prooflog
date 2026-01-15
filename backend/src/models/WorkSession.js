const mongoose = require("mongoose");

const WorkSessionSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: "Worker", required: true },
  siteId: { type: mongoose.Schema.Types.ObjectId, ref: "Site", required: true },

  startAt: { type: Date },
  startLat: { type: Number },
  startLng: { type: Number },
  startProofUrl: { type: String, default: "" },
  startProofPublicId: { type: String, default: "" },

  endAt: { type: Date },
  endLat: { type: Number },
  endLng: { type: Number },
  endProofUrl: { type: String, default: "" },
  endProofPublicId: { type: String, default: "" },

  extraOtHours: { type: Number, default: 0 }, // worker enters
  status: { type: String, enum: ["STARTED", "ENDED"], default: "STARTED" },

  // GPS inaccuracy manual override by admin
  overrideStartApproved: { type: Boolean, default: false },
  overrideEndApproved: { type: Boolean, default: false },
  overrideNote: { type: String, default: "" },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("WorkSession", WorkSessionSchema);
