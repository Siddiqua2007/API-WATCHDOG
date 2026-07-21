import Snapshot from "../models/Snapshot.js";
import Alert from "../models/Alert.js";

const ROLLING_WINDOW_HOURS = 24;
const MIN_SAMPLES_FOR_BASELINE = 5;
const LATENCY_MULTIPLIER = 1.5;

const percentile = (sortedValues, p) => {
  if (sortedValues.length === 0) return null;
  const index = Math.ceil((p / 100) * sortedValues.length) - 1;
  const clamped = Math.min(Math.max(index, 0), sortedValues.length - 1);
  return sortedValues[clamped];
};

const getRollingStats = async (endpointId) => {
  const since = new Date(Date.now() - ROLLING_WINDOW_HOURS * 60 * 60 * 1000);

  const recentSnapshots = await Snapshot.find({
    endpointId,
    timestamp: { $gte: since },
  }).sort({ timestamp: -1 });

  const successfulLatencies = recentSnapshots
    .filter((s) => s.success && typeof s.latencyMs === "number")
    .map((s) => s.latencyMs)
    .sort((a, b) => a - b);

  const totalChecks = recentSnapshots.length;
  const failedChecks = recentSnapshots.filter((s) => !s.success).length;

  return {
    sampleCount: successfulLatencies.length,
    p50: percentile(successfulLatencies, 50),
    p95: percentile(successfulLatencies, 95),
    p99: percentile(successfulLatencies, 99),
    errorRate: totalChecks > 0 ? failedChecks / totalChecks : 0,
    totalChecks,
    recentSnapshots,
  };
};

const detectAnomalies = async (endpoint, latestSnapshot) => {
  const anomalies = [];
  const stats = await getRollingStats(endpoint._id);

  if (!latestSnapshot.success) {
    anomalies.push({
      type: latestSnapshot.error?.toLowerCase().includes("timed out") ? "timeout" : "error_rate",
      severity: "warning",
      reason: latestSnapshot.error || `Unexpected status code ${latestSnapshot.statusCode}.`,
    });
  }

  if (
    latestSnapshot.success &&
    stats.sampleCount >= MIN_SAMPLES_FOR_BASELINE &&
    stats.p95 !== null &&
    latestSnapshot.latencyMs > stats.p95 * LATENCY_MULTIPLIER
  ) {
    anomalies.push({
      type: "latency",
      severity: "warning",
      reason: `Latency ${latestSnapshot.latencyMs}ms exceeds 1.5x the rolling p95 (${stats.p95}ms).`,
    });
  }

  const previousSuccessful = stats.recentSnapshots.find(
    (s) => s.success && s._id.toString() !== latestSnapshot._id.toString() && s.schemaHash
  );
  if (
    latestSnapshot.success &&
    latestSnapshot.schemaHash &&
    previousSuccessful &&
    previousSuccessful.schemaHash !== latestSnapshot.schemaHash
  ) {
    anomalies.push({
      type: "schema_drift",
      severity: "warning",
      reason: "The response's field structure changed since the previous successful check.",
    });
  }

  return anomalies;
};

const createOrEscalateAlerts = async (endpoint, anomalies) => {
  const alertsNeedingDiagnosis = [];

  for (const anomaly of anomalies) {
    const existingUnresolved = await Alert.findOne({
      endpointId: endpoint._id,
      type: anomaly.type,
      resolved: false,
    });

    if (existingUnresolved) {
      if (existingUnresolved.severity !== "critical") {
        existingUnresolved.severity = "critical";
        await existingUnresolved.save();
        alertsNeedingDiagnosis.push(existingUnresolved);
      }
      continue;
    }

    const newAlert = await Alert.create({
      endpointId: endpoint._id,
      type: anomaly.type,
      severity: "warning",
      triggeredAt: new Date(),
    });
    alertsNeedingDiagnosis.push(newAlert);
  }

  return alertsNeedingDiagnosis;
};

const processAnomaliesAndAlerts = async (endpoint, snapshot) => {
  const anomalies = await detectAnomalies(endpoint, snapshot);
  if (anomalies.length === 0) return [];

  const alertsNeedingDiagnosis = await createOrEscalateAlerts(endpoint, anomalies);
  if (alertsNeedingDiagnosis.length === 0) return [];

  const stats = await getRollingStats(endpoint._id);
  const recentSnapshots = stats.recentSnapshots;

  const { default: getDiagnosis } = await import("./ai.js");

  for (let i = 0; i < alertsNeedingDiagnosis.length; i++) {
    const alert = alertsNeedingDiagnosis[i];
    const matchingAnomaly = anomalies.find((a) => a.type === alert.type) || anomalies[0];

    const diagnosis = await getDiagnosis(endpoint, matchingAnomaly, recentSnapshots);
    alert.diagnosis = diagnosis;
    await alert.save();
  }

  return alertsNeedingDiagnosis;
};

export { detectAnomalies, createOrEscalateAlerts, getRollingStats, percentile, processAnomaliesAndAlerts };
