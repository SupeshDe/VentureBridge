import mongoose from 'mongoose'

const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  reportedStartup: { type: mongoose.Schema.Types.ObjectId, ref: 'Startup', index: true },
  reason: { 
    type: String, 
    enum: ['spam', 'fraud', 'inappropriate', 'fake-profile', 'harassment', 'other'],
    required: true 
  },
  description: { type: String, required: true, trim: true, maxlength: 1000 },
  status: { type: String, enum: ['pending', 'reviewing', 'resolved', 'dismissed'], default: 'pending', index: true },
  adminNotes: { type: String, trim: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
}, { timestamps: true })

reportSchema.index({ status: 1, createdAt: -1 })

export default mongoose.model('Report', reportSchema)
