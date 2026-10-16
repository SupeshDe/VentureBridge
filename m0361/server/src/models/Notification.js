import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { 
    type: String, 
    enum: [
      'new_recommendation',
      'new_match',
      'interest_received',
      'meeting_proposed',
      'meeting_accepted',
      'meeting_updated',
      'review_received',
      'collaboration_request',
      'request_accepted',
      'request_rejected',
      'new_message',
      'profile_verified',
      'profile_rejected',
      'admin_announcement',
      'platform_update'
    ], 
    required: true,
    index: true
  },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  message: { type: String, trim: true, maxlength: 500 },
  relatedId: { type: mongoose.Schema.Types.ObjectId },
  relatedModel: { type: String, enum: ['User', 'Startup', 'InvestorProfile', 'CollaborationRequest', 'Connection', 'Conversation', 'Message', 'Interest', 'Meeting'] },
  isRead: { type: Boolean, default: false, index: true },
}, { timestamps: true })

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 })

export default mongoose.model('Notification', notificationSchema)
