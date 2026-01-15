function performanceScore({ presentDays, jobsCompleted, invalidLeaves, missingProofCount }) {
  // Simple scoring 0-100 (editable later)
  let score = 60;
  score += presentDays * 1;
  score += jobsCompleted * 2;
  score -= invalidLeaves * 10;
  score -= missingProofCount * 5;

  if (score > 100) score = 100;
  if (score < 0) score = 0;
  return score;
}

module.exports = { performanceScore };
