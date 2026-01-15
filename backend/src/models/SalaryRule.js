const mongoose = require("mongoose");

const SalaryRuleSchema = new mongoose.Schema({
  standardDays: { type: Number, default: 30 },
  standardHoursPerDay: { type: Number, default: 10 },
  otMultiplier: { type: Number, default: 1.5 },
  invalidLeavePenalty: { type: Number, default: 100 },
  // Policy: prorate or fixed
  prorateBasic: { type: Boolean, default: true }, // if false -> fixed basic always
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("SalaryRule", SalaryRuleSchema);
