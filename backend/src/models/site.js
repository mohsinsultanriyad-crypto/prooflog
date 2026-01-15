const mongoose = require("mongoose");

const SiteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: String, default: "" },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  radiusMeters: { type: Number, default: 150 }, // adjustable 150-300
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Site", SiteSchema);
