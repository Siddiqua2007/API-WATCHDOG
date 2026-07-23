import "dotenv/config";
import mongoose from "mongoose";
import DetectorLog from "../models/DetectorLog.js";

const computeMetrics = (logs, detectorFlagKey) => {
  let truePositive = 0, falsePositive = 0, falseNegative = 0, trueNegative = 0;

  for (const log of logs) {
    const actuallyAnomalous = log.groundTruthLabel !== "none";
    const flagged = log[detectorFlagKey];

    if (actuallyAnomalous && flagged) truePositive++;
    else if (!actuallyAnomalous && flagged) falsePositive++;
    else if (actuallyAnomalous && !flagged) falseNegative++;
    else trueNegative++;
  }

  const precision = truePositive + falsePositive > 0 ? truePositive / (truePositive + falsePositive) : null;
  const recall = truePositive + falseNegative > 0 ? truePositive / (truePositive + falseNegative) : null;
  const f1 = precision !== null && recall !== null && (precision + recall) > 0
    ? (2 * precision * recall) / (precision + recall) : null;
  const accuracy = logs.length > 0 ? (truePositive + trueNegative) / logs.length : null;

  return { truePositive, falsePositive, falseNegative, trueNegative, precision, recall, f1, accuracy };
};

const formatPercent = (value) => (value === null ? "n/a" : `${(value * 100).toFixed(1)}%`);

const printMetrics = (name, m) => {
  console.log(`\n--- ${name} ---`);
  console.log(`Confusion matrix: TP=${m.truePositive} FP=${m.falsePositive} FN=${m.falseNegative} TN=${m.trueNegative}`);
  console.log(`Precision: ${formatPercent(m.precision)}`);
  console.log(`Recall:    ${formatPercent(m.recall)}`);
  console.log(`F1:        ${formatPercent(m.f1)}`);
  console.log(`Accuracy:  ${formatPercent(m.accuracy)}`);
};

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const logs = await DetectorLog.find({ groundTruthLabel: { $ne: null } });

  if (logs.length === 0) {
    console.log("No labeled entries found. Run labelDetectorLogs.js first.");
    await mongoose.disconnect();
    return;
  }

  console.log(`Scoring ${logs.length} labeled entries...`);

  const yourMetrics = computeMetrics(logs, "yourDetectorFlagged");
  const baselineMetrics = computeMetrics(logs, "baselineDetectorFlagged");

  printMetrics("Your Detector (p95 threshold)", yourMetrics);
  printMetrics("Baseline Detector (z-score)", baselineMetrics);

  console.log("\n--- Per-fault-type recall (your detector) ---");
  const faultTypes = [...new Set(logs.map((l) => l.groundTruthLabel))].filter((t) => t !== "none");
  for (const faultType of faultTypes) {
    const subset = logs.filter((l) => l.groundTruthLabel === faultType);
    const caught = subset.filter((l) => l.yourDetectorFlagged).length;
    console.log(`  ${faultType}: ${caught}/${subset.length} caught (${formatPercent(caught / subset.length)})`);
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Scoring failed:", err.message);
  process.exit(1);
});
