import mongoose from 'mongoose'

const SnapshotSchema = new mongoose.Schema({
  endpointId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Endpoint', required: true },
  statusCode:   { type: Number },              
  latencyMs:    { type: Number },             
  responseSize: { type: Number },               
  schemaHash:   { type: String },               
  success:      { type: Boolean },             
  error:        { type: String },                
  timestamp:    { type: Date, default: Date.now },
})


SnapshotSchema.index({ endpointId: 1, timestamp: -1 })

export default mongoose.model('Snapshot', SnapshotSchema)
