import "dotenv/config";
import mongoose from "mongoose";
import DetectorLog from "../models/DetectorLog.js";
import Incident from "../models/Incident.js";

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected.");

  const incidents = await Incident.find({ endedAt: { $ne: null } });
  console.log(`Found ${incidents.length} completed incident windows.`);

  let labeledCount = 0;

  for (const incident of incidents) {
    const result = await DetectorLog.updateMany(
      {
        endpointId: incident.endpointId,
        timestamp: { $gte: incident.startedAt, $lte: incident.endedAt },
      },
      { groundTruthLabel: incident.faultType }
    );
    labeledCount += result.modifiedCount;
    console.log(`  Incident ${incident._id} (${incident.faultType}): labeled ${result.modifiedCount} entries.`);
  }

  const normalResult = await DetectorLog.updateMany(
    { groundTruthLabel: null },
    { groundTruthLabel: "none" }
  );

  console.log(`\nLabeled ${labeledCount} entries from incident windows.`);
  console.log(`Labeled ${normalResult.modifiedCount} remaining entries as "none" (normal).`);

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Labeling failed:", err.message);
  process.exit(1);
});
