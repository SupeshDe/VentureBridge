import mongoose from 'mongoose'

/**
 * Investor "express interest" — a lightweight signal distinct from a
 * collaboration request. The entrepreneur sees interested investors and
 * can start a request; the investor gets match updates.
 */
const interestSchema = new mongoose.Schema(
  {
    investor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    startup: { type: mongoose.Schema.Types.ObjectId, ref: 'Startup', required: true, index: true },
    message: { type: String, trim: true, maxlength: 500 },
    status: { type: String, enum: ['new', 'seen', 'withdrawn'], default: 'new', index: true },
  },
  { timestamps: true }
)

interestSchema.index({ investor: 1, startup: 1 }, { unique: true })

export default mongoose.model('Interest', interestSchema)
