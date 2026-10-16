import mongoose from 'mongoose'

/**
 * Star reviews between connected counterparties.
 * Only users sharing an ACTIVE connection may review each other —
 * one review per reviewer → reviewee pair (editable, never duplicated).
 */
const reviewSchema = new mongoose.Schema(
  {
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reviewee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    startup: { type: mongoose.Schema.Types.ObjectId, ref: 'Startup' },
    stars: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
)

reviewSchema.index({ reviewer: 1, reviewee: 1 }, { unique: true })
reviewSchema.index({ reviewee: 1, createdAt: -1 })

export default mongoose.model('Review', reviewSchema)
