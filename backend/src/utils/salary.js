function calcSalary({ basicSalary, presentDays, otHours, invalidLeaves }) {
  // basicSalary/30 = per day
  const perDay = basicSalary / 30;

  // per hour (10 working hrs)
  const perHour = perDay / 10;

  // OT rate = perHour * 1.5
  const otRate = perHour * 1.5;

  const base = presentDays * perDay;
  const ot = otHours * otRate;

  const penalty = invalidLeaves * 100;

  const total = base + ot - penalty;

  return {
    perDay: round2(perDay),
    perHour: round2(perHour),
    otRate: round2(otRate),
    base: round2(base),
    ot: round2(ot),
    penalty: round2(penalty),
    total: round2(total),
  };
}

function round2(n) { return Math.round(n * 100) / 100; }

module.exports = { calcSalary };