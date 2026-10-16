import mongoose from 'mongoose'

const favouriteSchema = new mongoose.Schema({
  investor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  startup: { type: mongoose.Schema.Types.ObjectId, ref: 'Startup', required: true, index: true },
}, { timestamps: true })

// Compound unique index to prevent duplicates
favouriteSchema.index({ investor: 1, startup: 1 }, { unique: true })

export default mongoose.model('Favourite', favouriteSchema)
