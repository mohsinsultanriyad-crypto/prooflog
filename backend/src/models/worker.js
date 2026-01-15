const mongoose = require("mongoose");

const WorkerSchema = new mongoose.Schema(
  {
    phone: { type: String, unique: true, index: true, required: true },
    name: { type: String, default: "" },
    trade: { type: String, default: "" },
    photoUrl: { type: String, default: "" },

    // performance
    totalPresentDays: { type: Number, default: 0 },
    totalAbsentDays: { type: Number, default: 0 },
    invalidLeaves: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Worker", WorkerSchema);