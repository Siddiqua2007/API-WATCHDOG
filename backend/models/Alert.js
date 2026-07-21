import mongoose from 'mongoose'

const AlertSchema = new mongoose.Schema({
  endpointId: { type: mongoose.Schema.Types.ObjectId, ref: 'Endpoint', required: true },
  type:       { type: String, enum: ['latency', 'error_rate', 'schema_drift', 'timeout'] },
  severity:   { type: String, enum: ['warning', 'critical'], default: 'warning' },
  diagnosis:  { type: String },   
  resolved:   { type: Boolean, default: false },
  resolvedAt: { type: Date },
  triggeredAt:{ type: Date, default: Date.now },
})

AlertSchema.index({ endpointId: 1, triggeredAt: -1 })

export default mongoose.model('Alert', AlertSchema)
