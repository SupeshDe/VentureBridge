import mongoose from 'mongoose'

const collaborationRequestSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  senderRole: { type: String, enum: ['entrepreneur', 'investor'], required: true },
  receiverRole: { type: String, enum: ['entrepreneur', 'investor'], required: true },
  startup: { type: mongoose.Schema.Types.ObjectId, ref: 'Startup', required: true },
  message: { type: String, trim: true, maxlength: 1000 },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'cancelled'], default: 'pending', index: true },
}, { timestamps: true })

// Query index for a user's request history
collaborationRequestSchema.index({ sender: 1, receiver: 1, startup: 1, status: 1 })

// Enforce one pending request per sender/receiver/startup, including concurrent inserts.
collaborationRequestSchema.index(
  { sender: 1, receiver: 1, startup: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'pending' },
    name: 'unique_pending_collaboration_request',
  }
)

collaborationRequestSchema.post('save', function(error, _doc, next) {
  if (error.code === 11000) {
    const duplicate = new Error('An active request already exists for this connection')
    duplicate.statusCode = 409
    return next(duplicate)
  }
  next(error)
})

export default mongoose.model('CollaborationRequest', collaborationRequestSchema)
