import DetectorLog from "../models/DetectorLog.js";
import { getRollingStats } from "./anomalyDetection.js";
import { detectBaselineAnomaly } from "./baselineDetector.js";

const logDetectorComparison = async (endpoint, snapshot, anomalies) => {
  const stats = await getRollingStats(endpoint._id);

  const recentSuccessfulLatencies = stats.recentSnapshots
    .filter((s) => s.success && s._id.toString() !== snapshot._id.toString() && typeof s.latencyMs === "number")
    .map((s) => s.latencyMs);

  const baselineResult = detectBaselineAnomaly(snapshot, recentSuccessfulLatencies);

  const yourDetectorFlagged = anomalies.length > 0;
  const yourDetectorReason = yourDetectorFlagged
    ? anomalies.map((a) => `${a.type}: ${a.reason}`).join(" | ")
    : null;

  await DetectorLog.create({
    endpointId: endpoint._id,
    snapshotId: snapshot._id,
    yourDetectorFlagged,
    yourDetectorReason,
    baselineDetectorFlagged: baselineResult.flagged,
    baselineDetectorReason: baselineResult.reason,
    aiDiagnosis: null,
    timestamp: new Date(),
  });
};

const logFromPipelineResult = async (endpoint, snapshot, pipelineResult) => {
  try {
    await logDetectorComparison(endpoint, snapshot, pipelineResult.anomalies);

    const alertWithDiagnosis = pipelineResult.alerts.find((a) => a.diagnosis);
    if (alertWithDiagnosis) {
      await DetectorLog.findOneAndUpdate(
        { snapshotId: snapshot._id },
        { aiDiagnosis: alertWithDiagnosis.diagnosis }
      );
    }
  } catch (err) {
    console.error(`Research logging failed for endpoint "${endpoint.name}":`, err.message);
  }
};

export { logDetectorComparison, logFromPipelineResult };
