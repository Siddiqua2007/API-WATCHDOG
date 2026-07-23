import mongoose from "mongoose";

const IncidentSchema = new mongoose.Schema(
  {
    endpointId: { type: mongoose.Schema.Types.ObjectId, ref: "Endpoint", required: true },
    faultType: {
      type: String,
      enum: ["latency_spike", "hard_failure", "schema_drift"],
      required: true,
    },
    startedAt: { type: Date, required: true, default: Date.now },
    endedAt: { type: Date, default: null },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Incident", IncidentSchema);
