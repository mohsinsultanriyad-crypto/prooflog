const mongoose = require("mongoose");

const PhotoSchema = new mongoose.Schema({
  publicId: { type: String, required: true },
  url: { type: String, required: true },
  kind: { type: String, enum: ["WORK_START", "WORK_END", "LEAVE", "PROFILE"], required: true },
  ownerType: { type: String, enum: ["Worker", "WorkSession", "Leave"], required: true },
  ownerId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Photo", PhotoSchema);
