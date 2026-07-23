import "dotenv/config";
import mongoose from "mongoose";
import fs from "fs";
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
  const f1 = precision !== null && recall !== null && (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : null;
  const accuracy = logs.length > 0 ? (truePositive + trueNegative) / logs.length : null;
  return { truePositive, falsePositive, falseNegative, trueNegative, precision, recall, f1, accuracy };
};

const pct = (v) => (v === null ? "n/a" : `${(v * 100).toFixed(1)}%`);

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const logs = await DetectorLog.find({ groundTruthLabel: { $ne: null } });
  if (logs.length === 0) {
    console.log("No labeled entries found — run labelDetectorLogs.js first.");
    await mongoose.disconnect();
    return;
  }

  const yourM = computeMetrics(logs, "yourDetectorFlagged");
  const baseM = computeMetrics(logs, "baselineDetectorFlagged");

  const faultTypes = [...new Set(logs.map((l) => l.groundTruthLabel))].filter((t) => t !== "none");
  const perFaultRows = faultTypes.map((ft) => {
    const subset = logs.filter((l) => l.groundTruthLabel === ft);
    const caughtYours = subset.filter((l) => l.yourDetectorFlagged).length;
    const caughtBaseline = subset.filter((l) => l.baselineDetectorFlagged).length;
    return `| ${ft} | ${subset.length} | ${caughtYours}/${subset.length} (${pct(caughtYours / subset.length)}) | ${caughtBaseline}/${subset.length} (${pct(caughtBaseline / subset.length)}) |`;
  });

  const md = `# Results Summary (auto-generated from DetectorLog)

Generated on: ${new Date().toISOString()}
Total labeled checks scored: ${logs.length}

## Table 1 — Detector Comparison (Precision / Recall / F1)

| Metric | Your Detector (p95 threshold) | Baseline (z-score) |
|---|---|---|
| Precision | ${pct(yourM.precision)} | ${pct(baseM.precision)} |
| Recall | ${pct(yourM.recall)} | ${pct(baseM.recall)} |
| F1 Score | ${pct(yourM.f1)} | ${pct(baseM.f1)} |
| Accuracy | ${pct(yourM.accuracy)} | ${pct(baseM.accuracy)} |

## Table 2 — Confusion Matrix

| | Your Detector | Baseline Detector |
|---|---|---|
| True Positives | ${yourM.truePositive} | ${baseM.truePositive} |
| False Positives | ${yourM.falsePositive} | ${baseM.falsePositive} |
| False Negatives | ${yourM.falseNegative} | ${baseM.falseNegative} |
| True Negatives | ${yourM.trueNegative} | ${baseM.trueNegative} |

## Table 3 — Per-Fault-Type Recall

| Fault Type | Sample Count | Your Detector Caught | Baseline Caught |
|---|---|---|---|
${perFaultRows.join("\n")}

---
*Remember to also report the LLM diagnosis accuracy (human-rated, from your rubric) separately — that number isn't in DetectorLog and needs to come from your manual rating spreadsheet.*
`;

  fs.writeFileSync("./results-summary.md", md);
  console.log("Written to ./results-summary.md");
  console.log("\n" + md);

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Failed to generate summary:", err.message);
  process.exit(1);
});
