import mongoose from 'mongoose'

/**
 * A proposed first call (or follow-up) inside a connection.
 * One proposal carries up to 3 candidate slots; the other party picks one.
 */
const meetingSchema = new mongoose.Schema(
  {
    connection: { type: mongoose.Schema.Types.ObjectId, ref: 'Connection', required: true, index: true },
    proposedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    slots: [{ type: Date, required: true }],
    chosenSlot: { type: Date },
    link: { type: String, trim: true, maxlength: 500 },
    note: { type: String, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ['proposed', 'accepted', 'declined', 'cancelled'],
      default: 'proposed',
      index: true,
    },
  },
  { timestamps: true }
)

meetingSchema.index({ connection: 1, status: 1, createdAt: -1 })

export default mongoose.model('Meeting', meetingSchema)
