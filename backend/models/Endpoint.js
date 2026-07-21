import mongoose from 'mongoose'

const EndpointSchema = new mongoose.Schema({
  owner:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:           { type: String, required: true },     
  url:            { type: String, required: true },     
  method:         { type: String, default: 'GET' },     
  expectedStatus: { type: Number, default: 200 },
  intervalMins:   { type: Number, default: 5 },        
  headers:        { type: Map, of: String, default: {} }, 
  active:         { type: Boolean, default: true },
  lastCheckedAt:  { type: Date },
}, { timestamps: true })

export default mongoose.model('Endpoint', EndpointSchema)
