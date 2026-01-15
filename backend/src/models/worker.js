const mongoose = require("mongoose");

const WorkerSchema = new mongoose.Schema({
  phone: { type: String, unique: true, required: true },
  name: { type: String, default: "" },
  trade: { type: String, default: "" },
  profilePhotoUrl: { type: String, default: "" },
  profilePhotoPublicId: { type: String, default: "" },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Worker", WorkerSchema);
