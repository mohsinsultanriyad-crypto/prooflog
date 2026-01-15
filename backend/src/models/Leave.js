const mongoose = require("mongoose");

const LeaveSchema = new mongoose.Schema(
  {
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: "Worker", required: true },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    type: { type: String, enum: ["MEDICAL", "ABSENT", "OTHER"], required: true },
    reason: { type: String, default: "" },
    valid: { type: Boolean, default: false }, // company marks valid later
  },
  { timestamps: true }
);

module.exports = mongoose.model("Leave", LeaveSchema);