import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, trim: true, maxlength: 5000 },
  attachment: { type: String },
  attachmentType: { type: String, enum: ['image', 'document', 'pitch-deck', 'other'] },
  isRead: { type: Boolean, default: false, index: true },
}, { timestamps: true })

messageSchema.index({ conversation: 1, createdAt: -1 })
messageSchema.index({ sender: 1, createdAt: -1 })

export default mongoose.model('Message', messageSchema)
