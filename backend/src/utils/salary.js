function computeRates({ basicSalary, standardDays, standardHoursPerDay, otMultiplier }) {
  const dailyRate = basicSalary / standardDays;
  const hourlyRate = dailyRate / standardHoursPerDay;
  const otRate = hourlyRate * otMultiplier;
  return { dailyRate, hourlyRate, otRate };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = { computeRates, round2 };
