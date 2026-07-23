import "dotenv/config";
import mongoose from "mongoose";
import DetectorLog from "../models/DetectorLog.js";

const TARGET_MIN = 30;
const TARGET_MAX = 50;

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const total = await DetectorLog.countDocuments();
  const labeled = await DetectorLog.countDocuments({ groundTruthLabel: { $ne: null } });

  console.log(`Total DetectorLog entries: ${total}`);
  console.log(`Labeled: ${labeled} | Unlabeled: ${total - labeled}\n`);

  const breakdown = await DetectorLog.aggregate([
    { $match: { groundTruthLabel: { $ne: null } } },
    { $group: { _id: "$groundTruthLabel", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  console.log("Breakdown by label:");
  breakdown.forEach((b) => console.log(`  ${b._id}: ${b.count}`));

  const nonNormalCount = breakdown.filter((b) => b._id !== "none").reduce((sum, b) => sum + b.count, 0);
  console.log(`\nTotal induced-fault entries (excluding "none"): ${nonNormalCount}`);

  if (nonNormalCount < TARGET_MIN) {
    console.log(`\nBelow target (${TARGET_MIN}-${TARGET_MAX}) — keep injecting more faults.`);
  } else {
    console.log(`\nWithin/above target range — ready for Day 11 scoring.`);
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Coverage check failed:", err.message);
  process.exit(1);
});
