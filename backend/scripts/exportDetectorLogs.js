import "dotenv/config";
import mongoose from "mongoose";
import fs from "fs";
import DetectorLog from "../models/DetectorLog.js";

const csvEscape = (value) => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected. Fetching DetectorLog entries...");

  const logs = await DetectorLog.find()
    .populate("endpointId", "name url")
    .sort({ timestamp: 1 });

  console.log(`Found ${logs.length} log entries.`);

  const headers = [
    "timestamp", "endpointName", "endpointUrl",
    "yourDetectorFlagged", "yourDetectorReason",
    "baselineDetectorFlagged", "baselineDetectorReason",
    "aiDiagnosis", "groundTruthLabel",
  ];

  const rows = logs.map((log) => [
    log.timestamp.toISOString(),
    log.endpointId?.name || "",
    log.endpointId?.url || "",
    log.yourDetectorFlagged,
    log.yourDetectorReason,
    log.baselineDetectorFlagged,
    log.baselineDetectorReason,
    log.aiDiagnosis,
    log.groundTruthLabel || "",
  ]);

  const csvLines = [
    headers.join(","),
    ...rows.map((row) => row.map(csvEscape).join(",")),
  ];

  fs.writeFileSync("./detector-logs-export.csv", csvLines.join("\n"));
  console.log(`Exported ${logs.length} rows to ./detector-logs-export.csv`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Export failed:", err.message);
  process.exit(1);
});
