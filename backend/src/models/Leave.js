const mongoose = require("mongoose");

const LeaveSchema = new mongoose.Schema({
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: "Worker", required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  type: { type: String, enum: ["MEDICAL", "EMERGENCY", "PERSONAL", "SITE_CLOSED", "INVALID"], required: true },
  reasonText: { type: String, default: "" },
  proofUrl: { type: String, default: "" },
  proofPublicId: { type: String, default: "" },
  status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Leave", LeaveSchema);
