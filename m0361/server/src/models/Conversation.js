import mongoose from 'mongoose'

const conversationSchema = new mongoose.Schema({
  connection: { type: mongoose.Schema.Types.ObjectId, ref: 'Connection', required: true, unique: true, index: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  lastMessageAt: { type: Date },
  unreadCount: { 
    type: Map, 
    of: Number, 
    default: () => new Map() 
  },
}, { timestamps: true })

conversationSchema.index({ participants: 1 })
conversationSchema.index({ lastMessageAt: -1 })

export default mongoose.model('Conversation', conversationSchema)
