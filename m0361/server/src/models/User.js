import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 }, email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true }, password: { type: String, required: true, minlength: 8, select: false }, role: { type: String, enum: ['entrepreneur', 'investor', 'admin'], default: 'entrepreneur' }, profileImage: String, location: String, isVerified: { type: Boolean, default: false }, verificationCodeHash: { type: String, select: false }, verificationCodeExpiresAt: { type: Date, select: false }, verificationCodeAttempts: { type: Number, default: 0, select: false }, verificationCodeSentAt: { type: Date, select: false }, isActive: { type: Boolean, default: true },
}, { timestamps: true })
userSchema.pre('save', async function () { if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12) })
userSchema.methods.comparePassword = function (password) { return bcrypt.compare(password, this.password) }
export default mongoose.model('User', userSchema)
