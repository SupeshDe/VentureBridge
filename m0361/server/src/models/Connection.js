import mongoose from 'mongoose'

const connectionSchema = new mongoose.Schema({
  entrepreneur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  investor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  startup: { type: mongoose.Schema.Types.ObjectId, ref: 'Startup', required: true },
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'CollaborationRequest', required: true },
  status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active', index: true },
  connectedAt: { type: Date, default: Date.now },
  lastActivity: { type: Date, default: Date.now },
}, { timestamps: true })

// Compound index to ensure unique connections
connectionSchema.index({ entrepreneur: 1, investor: 1, startup: 1 }, { unique: true })

export default mongoose.model('Connection', connectionSchema)
