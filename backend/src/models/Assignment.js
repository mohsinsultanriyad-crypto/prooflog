const mongoose = require("mongoose");

const AssignmentSchema = new mongoose.Schema({
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: "Worker", required: true },
  siteId: { type: mongoose.Schema.Types.ObjectId, ref: "Site", required: true },
  dutyDate: { type: String, required: true }, // YYYY-MM-DD
  notes: { type: String, default: "" },
  status: { type: String, enum: ["ASSIGNED", "IN_PROGRESS", "DONE", "CANCELLED"], default: "ASSIGNED" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Assignment", AssignmentSchema);
