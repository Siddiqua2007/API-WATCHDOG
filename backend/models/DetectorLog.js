import mongoose from "mongoose";

const DetectorLogSchema = new mongoose.Schema(
  {
    endpointId: { type: mongoose.Schema.Types.ObjectId, ref: "Endpoint", required: true },
    snapshotId: { type: mongoose.Schema.Types.ObjectId, ref: "Snapshot", required: true },

    yourDetectorFlagged: { type: Boolean, required: true },
    yourDetectorReason: { type: String, default: null },

    baselineDetectorFlagged: { type: Boolean, required: true },
    baselineDetectorReason: { type: String, default: null },

    aiDiagnosis: { type: String, default: null },

    groundTruthLabel: {
      type: String,
      enum: ["none", "latency_spike", "hard_failure", "schema_drift", null],
      default: null,
    },

    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

DetectorLogSchema.index({ endpointId: 1, timestamp: -1 });

export default mongoose.model("DetectorLog", DetectorLogSchema);
