import mongoose from 'mongoose'

const documentSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  startup: { type: mongoose.Schema.Types.ObjectId, ref: 'Startup' },
  connection: { type: mongoose.Schema.Types.ObjectId, ref: 'Connection', index: true },
  fileName: { type: String, required: true, trim: true },
  fileType: { 
    type: String, 
    enum: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'png', 'jpg', 'jpeg', 'other'],
    required: true 
  },
  fileUrl: { type: String, required: true },
  fileSize: { type: Number },
  category: { 
    type: String, 
    enum: ['pitch-deck', 'business-plan', 'financial', 'legal', 'other'],
    default: 'other'
  },
  description: { type: String, trim: true, maxlength: 500 },
  visibility: { type: String, enum: ['private', 'connections', 'public'], default: 'private' },
  isVerified: { type: Boolean, default: false },
}, { timestamps: true })

documentSchema.index({ owner: 1, category: 1 })
documentSchema.index({ startup: 1 })

export default mongoose.model('Document', documentSchema)
