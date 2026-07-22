const Z_SCORE_THRESHOLD = 2;
const MIN_SAMPLES = 5;

const mean = (values) => values.reduce((sum, v) => sum + v, 0) / values.length;

const stdDev = (values, avg) => {
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
};

const detectBaselineAnomaly = (snapshot, recentSuccessfulLatencies) => {
  if (!snapshot.success) {
    return { flagged: true, reason: "Check failed outright (non-2xx or network error)." };
  }

  if (recentSuccessfulLatencies.length < MIN_SAMPLES) {
    return { flagged: false, reason: "Insufficient history for a baseline (fewer than 5 samples)." };
  }

  const avg = mean(recentSuccessfulLatencies);
  const sd = stdDev(recentSuccessfulLatencies, avg);

  if (sd === 0) {
    return { flagged: false, reason: "No variance in recent latency history." };
  }

  const zScore = (snapshot.latencyMs - avg) / sd;
  const flagged = zScore > Z_SCORE_THRESHOLD;

  return {
    flagged,
    reason: `z-score = ${zScore.toFixed(2)} (mean=${avg.toFixed(1)}ms, stdDev=${sd.toFixed(1)}ms)`,
    zScore,
  };
};

export { detectBaselineAnomaly, mean, stdDev };
