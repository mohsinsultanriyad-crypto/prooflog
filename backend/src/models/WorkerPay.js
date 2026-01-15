const mongoose = require("mongoose");

const WorkerPaySchema = new mongoose.Schema({
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: "Worker", unique: true, required: true },
  basicSalary: { type: Number, default: 1000 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("WorkerPay", WorkerPaySchema);
