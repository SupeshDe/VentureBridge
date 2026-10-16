import mongoose from 'mongoose'

const investorFavouriteSchema = new mongoose.Schema({
  entrepreneur: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  investorProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'InvestorProfile', required: true, index: true },
}, { timestamps: true })

investorFavouriteSchema.index({ entrepreneur: 1, investorProfile: 1 }, { unique: true })

export default mongoose.model('InvestorFavourite', investorFavouriteSchema)
